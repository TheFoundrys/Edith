/**
 * Copy course names and syllabus content from edith_dev → compass_dev.
 *
 * Preserves Program.id as Course.id (programId ≡ courseId).
 * Maps Edith SyllabusLesson → Compass Lesson:
 *   VIDEO_URL content → videoUrl, summary → content
 *
 *   npx tsx scripts/copy-edith-courses-to-compass.ts --dry-run
 *   npx tsx scripts/copy-edith-courses-to-compass.ts --execute
 *   npx tsx scripts/copy-edith-courses-to-compass.ts --execute --replace
 *   npx tsx scripts/copy-edith-courses-to-compass.ts --export=docs/course-catalog-export.json
 *
 * Env (optional):
 *   EDITH_DATABASE_URL   — source (default: same host as DATABASE_URL, db edith_dev)
 *   COMPASS_DATABASE_URL — target (default: DATABASE_URL)
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, type LessonContentType } from "@prisma/client";

const argv = process.argv.slice(2);
const dryRun = !argv.includes("--execute");
const replaceContent = argv.includes("--replace");
const exportArg = argv.find((a) => a.startsWith("--export="));
const exportPath = exportArg?.slice("--export=".length);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function databaseUrlForDb(baseUrl: string | undefined, dbName: string) {
  if (!baseUrl?.trim()) return undefined;
  const url = new URL(baseUrl);
  url.pathname = `/${dbName}`;
  if (!url.searchParams.has("connect_timeout")) {
    url.searchParams.set("connect_timeout", "10");
  }
  return url.toString();
}

function hostLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "(invalid url)";
  }
}

function edithLessonToCompass(lesson: {
  title: string;
  summary: string | null;
  contentType: LessonContentType;
  content: string;
  videoUrl: string | null;
  durationMin: number | null;
  duration: string | null;
  slug: string | null;
  type: string | null;
  isFree: boolean;
  isPreview: boolean;
}) {
  let videoUrl = lesson.videoUrl?.trim() || null;
  let content = lesson.summary?.trim() || null;

  if (lesson.contentType === "VIDEO_URL") {
    videoUrl = videoUrl || lesson.content.trim() || null;
  } else if (
    lesson.contentType === "PDF_FILE" ||
    lesson.contentType === "EXTERNAL_LINK" ||
    lesson.contentType === "RICH_TEXT"
  ) {
    content = lesson.content.trim() || lesson.summary?.trim() || null;
    videoUrl = null;
  } else {
    content = lesson.content.trim() || lesson.summary?.trim() || null;
    videoUrl = null;
  }

  const lessonType =
    lesson.contentType === "VIDEO_URL"
      ? "VIDEO"
      : lesson.type === "QUIZ" || lesson.type === "ASSIGNMENT"
        ? lesson.type
        : "TEXT";

  return {
    title: lesson.title,
    slug: lesson.slug?.trim() || slugify(lesson.title) || `lesson-${lesson.title.slice(0, 24)}`,
    type: lessonType,
    content,
    videoUrl,
    duration:
      lesson.duration ??
      (lesson.durationMin != null ? `${lesson.durationMin} min` : null),
    isFree: lesson.isFree,
    isPreview: lesson.isPreview,
  };
}

async function resolveDomain(
  edith: PrismaClient,
  compass: PrismaClient,
  organizationId: string,
) {
  const org = await edith.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  const preferred = process.env.DEFAULT_ORG_SLUG?.trim() || org?.slug;
  if (preferred) {
    const rows = await compass.$queryRaw<{ id: string; slug: string }[]>`
      SELECT id, slug FROM "Domain" WHERE slug = ${preferred} LIMIT 1
    `;
    if (rows[0]) return rows[0];
  }
  const fallback = await compass.$queryRaw<{ id: string; slug: string }[]>`
    SELECT id, slug FROM "Domain" ORDER BY "order" ASC NULLS LAST, title ASC LIMIT 1
  `;
  if (!fallback[0]) {
    throw new Error("compass_dev has no Domain rows — cannot assign courses.");
  }
  return fallback[0];
}

async function main() {
  const compassUrl =
    process.env.COMPASS_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  const edithUrl =
    process.env.EDITH_DATABASE_URL?.trim() ||
    databaseUrlForDb(compassUrl, "edith_dev");

  if (!compassUrl || !edithUrl) {
    console.error("Set COMPASS_DATABASE_URL and EDITH_DATABASE_URL (or DATABASE_URL).");
    process.exit(1);
  }

  console.log(`Source (edith):  ${hostLabel(edithUrl)}`);
  console.log(`Target (compass): ${hostLabel(compassUrl)}`);

  const edith = new PrismaClient({ datasourceUrl: edithUrl });
  const compass = new PrismaClient({ datasourceUrl: compassUrl });

  try {
    const programs = await edith.program.findMany({
      include: {
        organization: { select: { slug: true } },
        syllabus: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                lessons: {
                  where: { isPublished: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    });

    console.log(
      `${dryRun ? "[dry-run] " : ""}Found ${programs.length} Edith program(s) to copy.`,
    );

    const exportPayload: {
      copiedAt: string;
      courses: Array<{
        id: string;
        title: string;
        slug: string;
        modules: Array<{
          title: string;
          lessons: Array<{ title: string; contentType: string; content: string; summary: string | null }>;
        }>;
      }>;
    } = { copiedAt: new Date().toISOString(), courses: [] };

    let courseCount = 0;
    let moduleCount = 0;
    let lessonCount = 0;

    for (const program of programs) {
      const modules = program.syllabus?.modules ?? [];
      const lessonTotal = modules.reduce((n, m) => n + m.lessons.length, 0);
      console.log(
        `• ${program.title} (${program.slug}) — ${modules.length} module(s), ${lessonTotal} lesson(s)`,
      );

      exportPayload.courses.push({
        id: program.id,
        title: program.title,
        slug: program.slug,
        modules: modules.map((mod) => ({
          title: mod.title,
          lessons: mod.lessons.map((lesson) => ({
            title: lesson.title,
            contentType: lesson.contentType,
            content: lesson.content,
            summary: lesson.summary,
          })),
        })),
      });

      if (dryRun && !exportPath) continue;

      const domain = await resolveDomain(edith, compass, program.organizationId);
      const now = new Date();
      const isPublished = program.status === "PUBLISHED";

      let courseId = program.id;
      if (!dryRun) {
        const bySlug = await compass.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Course" WHERE slug = ${program.slug} LIMIT 1
        `;
        if (bySlug[0]) {
          courseId = bySlug[0].id;
          if (courseId !== program.id) {
            console.log(
              `  ↳ slug "${program.slug}" exists as ${courseId} (edith id ${program.id}) — updating in place`,
            );
          }
        }

        const existingById = await compass.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Course" WHERE id = ${courseId} LIMIT 1
        `;

        if (existingById[0]) {
          await compass.$executeRaw`
            UPDATE "Course" SET
              title = ${program.title},
              slug = ${program.slug},
              description = ${program.description ?? ""},
              "domainId" = ${domain.id},
              "domainSlug" = ${program.domainSlug ?? domain.slug},
              thumbnail = ${program.imageUrl},
              price = ${program.price ?? 0},
              level = ${program.level ?? "BEGINNER"}::"CourseLevel",
              "learningOutcomes" = ${program.learningOutcomes ?? []},
              tags = ${program.tags ?? []},
              type = ${program.type ?? "SELF_PACED"}::"CourseType",
              duration = ${program.duration},
              "isHybridOnly" = ${program.isHybridOnly ?? false},
              "isPublished" = ${isPublished},
              "publishedAt" = ${isPublished ? program.publishedAt ?? now : null},
              "updatedAt" = ${now}
            WHERE id = ${courseId}
          `;
        } else {
          await compass.$executeRaw`
            INSERT INTO "Course" (
              id, title, slug, description, "domainId", "domainSlug", thumbnail, price,
              level, "learningOutcomes", tags, type, duration, "isHybridOnly", "isPublished",
              "publishedAt", "createdAt", "updatedAt"
            ) VALUES (
              ${courseId},
              ${program.title},
              ${program.slug},
              ${program.description ?? ""},
              ${domain.id},
              ${program.domainSlug ?? domain.slug},
              ${program.imageUrl},
              ${program.price ?? 0},
              ${program.level ?? "BEGINNER"}::"CourseLevel",
              ${program.learningOutcomes ?? []},
              ${program.tags ?? []},
              ${program.type ?? "SELF_PACED"}::"CourseType",
              ${program.duration},
              ${program.isHybridOnly ?? false},
              ${isPublished},
              ${isPublished ? program.publishedAt ?? now : null},
              ${program.createdAt ?? now},
              ${now}
            )
          `;
        }
        courseCount += 1;

        if (replaceContent) {
          await compass.$executeRaw`DELETE FROM "Lesson" WHERE "courseId" = ${courseId}`;
          await compass.$executeRaw`DELETE FROM "Module" WHERE "courseId" = ${courseId}`;
        }
      }

      for (const mod of modules) {
        if (!dryRun) {
          const moduleSlug =
            mod.slug?.trim() || slugify(mod.title) || `module-${mod.order}`;
          await compass.$executeRaw`
            INSERT INTO "Module" (
              id, "courseId", title, slug, goal, "order", duration, "createdAt", "updatedAt"
            ) VALUES (
              ${mod.id},
              ${courseId},
              ${mod.title},
              ${moduleSlug},
              ${mod.summary},
              ${mod.order},
              ${mod.duration},
              ${mod.createdAt ?? now},
              ${now}
            )
            ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              slug = EXCLUDED.slug,
              goal = EXCLUDED.goal,
              "order" = EXCLUDED."order",
              duration = EXCLUDED.duration,
              "courseId" = EXCLUDED."courseId",
              "updatedAt" = EXCLUDED."updatedAt"
          `;
        }
        moduleCount += 1;

        for (const lesson of mod.lessons) {
          const mapped = edithLessonToCompass(lesson);
          if (!dryRun) {
            await compass.$executeRaw`
              INSERT INTO "Lesson" (
                id, "moduleId", "courseId", title, slug, type, content, "videoUrl",
                duration, "order", "isFree", "isPreview", "createdAt", "updatedAt"
              ) VALUES (
                ${lesson.id},
                ${mod.id},
                ${courseId},
                ${mapped.title},
                ${mapped.slug},
                ${mapped.type}::"LessonType",
                ${mapped.content},
                ${mapped.videoUrl},
                ${mapped.duration},
                ${lesson.order},
                ${mapped.isFree},
                ${mapped.isPreview},
                ${lesson.createdAt ?? now},
                ${now}
              )
              ON CONFLICT (id) DO UPDATE SET
                "moduleId" = EXCLUDED."moduleId",
                "courseId" = EXCLUDED."courseId",
                title = EXCLUDED.title,
                slug = EXCLUDED.slug,
                type = EXCLUDED.type,
                content = EXCLUDED.content,
                "videoUrl" = EXCLUDED."videoUrl",
                duration = EXCLUDED.duration,
                "order" = EXCLUDED."order",
                "isFree" = EXCLUDED."isFree",
                "isPreview" = EXCLUDED."isPreview",
                "updatedAt" = EXCLUDED."updatedAt"
            `;
          }
          lessonCount += 1;
        }
      }
    }

    if (exportPath) {
      const out = resolve(process.cwd(), exportPath);
      writeFileSync(out, JSON.stringify(exportPayload, null, 2));
      console.log(`Exported catalog JSON → ${out}`);
    }

    console.log(
      dryRun
        ? "Dry run complete. Re-run with --execute to write to compass_dev."
        : `Copied ${courseCount} course(s), ${moduleCount} module(s), ${lessonCount} lesson(s) to compass_dev.`,
    );
  } finally {
    await edith.$disconnect();
    await compass.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
