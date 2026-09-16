/**
 * Copy program names and syllabus content between Edith databases (Program/Syllabus*).
 *
 * Matches programs by slug. Keeps the target program id (enrollments stay valid).
 * Replaces modules and lessons under each syllabus.
 *
 *   npx tsx scripts/sync-edith-syllabus-from-remote.ts --dry-run
 *   npx tsx scripts/sync-edith-syllabus-from-remote.ts --execute
 *
 * Env:
 *   EDITH_SOURCE_URL — source (default: remote edith on LAN)
 *   EDITH_TARGET_URL — target (default: DATABASE_URL / local edith_dev)
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const argv = process.argv.slice(2);
const dryRun = !argv.includes("--execute");

const sourceUrl =
  process.env.EDITH_SOURCE_URL?.trim() ||
  "postgresql://postgres:BChsiwefqodcn@192.168.1.3:5432/edith_dev?schema=public";
const targetUrl =
  process.env.EDITH_TARGET_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

function hostLabel(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return url;
  }
}

const programInclude = {
  syllabus: {
    include: {
      modules: {
        orderBy: { order: "asc" as const },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" as const },
          },
        },
      },
    },
  },
} satisfies Prisma.ProgramInclude;

async function main() {
  if (!targetUrl) {
    console.error("Set EDITH_TARGET_URL or DATABASE_URL.");
    process.exit(1);
  }

  console.log(`Source: ${hostLabel(sourceUrl)}`);
  console.log(`Target: ${hostLabel(targetUrl)}`);
  console.log(dryRun ? "[dry-run]" : "[execute]");

  const source = new PrismaClient({ datasourceUrl: sourceUrl });
  const target = new PrismaClient({ datasourceUrl: targetUrl });

  try {
    const remotePrograms = await source.program.findMany({
      include: programInclude,
      orderBy: { title: "asc" },
    });

    const localBySlug = new Map(
      (
        await target.program.findMany({
          select: { id: true, slug: true, organizationId: true },
        })
      ).map((p) => [p.slug, p]),
    );

    let updated = 0;
    let created = 0;
    let modules = 0;
    let lessons = 0;

    for (const remote of remotePrograms) {
      const modulesRemote = remote.syllabus?.modules ?? [];
      const lessonsRemote = modulesRemote.reduce((n, m) => n + m.lessons.length, 0);
      const local = localBySlug.get(remote.slug);

      console.log(
        `• ${remote.title} (${remote.slug}) — ${modulesRemote.length} module(s), ${lessonsRemote} lesson(s)`,
      );

      if (dryRun) {
        if (!local) console.log("  ↳ would create program");
        updated += local ? 1 : 0;
        created += local ? 0 : 1;
        modules += modulesRemote.length;
        lessons += lessonsRemote;
        continue;
      }

      let programId = local?.id;

      if (!programId) {
        const defaultOrg = await target.organization.findFirst({
          where: { slug: process.env.DEFAULT_ORG_SLUG?.trim() || "the-foundrys" },
          select: { id: true },
        });
        if (!defaultOrg) {
          throw new Error("Target has no organization — run db:seed first.");
        }

        const createdProgram = await target.program.create({
          data: {
            id: remote.id,
            organizationId: defaultOrg.id,
            campusId: null,
            departmentId: null,
            title: remote.title,
            slug: remote.slug,
            description: remote.description,
            eligibilitySummary: remote.eligibilitySummary,
            imageUrl: remote.imageUrl,
            price: remote.price,
            tuitionCurrency: remote.tuitionCurrency,
            duration: remote.duration,
            level: remote.level,
            type: remote.type,
            programKind: remote.programKind,
            status: remote.status,
            category: remote.category,
            degreeLevel: remote.degreeLevel,
            domainSlug: remote.domainSlug,
            domain: remote.domain,
            tags: remote.tags ?? [],
            learningOutcomes: remote.learningOutcomes ?? [],
            isHybridOnly: remote.isHybridOnly ?? false,
            crmCatalogId: remote.crmCatalogId,
            publishedAt: remote.publishedAt,
            sku: remote.sku,
            weeks: remote.weeks,
            originalPrice: remote.originalPrice,
            pricing: remote.pricing ?? undefined,
            curriculum: remote.curriculum ?? undefined,
          },
        });
        programId = createdProgram.id;
        localBySlug.set(remote.slug, {
          id: programId,
          slug: remote.slug,
          organizationId: remote.organizationId,
        });
        created += 1;
      } else {
        await target.program.update({
          where: { id: programId },
          data: {
            title: remote.title,
            description: remote.description,
            eligibilitySummary: remote.eligibilitySummary,
            imageUrl: remote.imageUrl,
            price: remote.price,
            tuitionCurrency: remote.tuitionCurrency,
            duration: remote.duration,
            level: remote.level,
            type: remote.type,
            programKind: remote.programKind,
            status: remote.status,
            category: remote.category,
            degreeLevel: remote.degreeLevel,
            domainSlug: remote.domainSlug,
            domain: remote.domain,
            tags: remote.tags ?? [],
            learningOutcomes: remote.learningOutcomes ?? [],
            isHybridOnly: remote.isHybridOnly ?? false,
            crmCatalogId: remote.crmCatalogId,
            publishedAt: remote.publishedAt,
            sku: remote.sku,
            weeks: remote.weeks,
            originalPrice: remote.originalPrice,
            pricing: remote.pricing ?? undefined,
            curriculum: remote.curriculum ?? undefined,
          },
        });
        updated += 1;
      }

      let syllabusId = (
        await target.programSyllabus.findUnique({
          where: { programId },
          select: { id: true },
        })
      )?.id;

      if (!syllabusId) {
        const syllabus = await target.programSyllabus.create({
          data: {
            programId,
            title: remote.syllabus?.title,
            description: remote.syllabus?.description,
            status: remote.syllabus?.status ?? "PUBLISHED",
          },
        });
        syllabusId = syllabus.id;
      } else if (remote.syllabus) {
        await target.programSyllabus.update({
          where: { id: syllabusId },
          data: {
            title: remote.syllabus.title,
            description: remote.syllabus.description,
            status: remote.syllabus.status,
          },
        });
      }

      await target.syllabusModule.deleteMany({ where: { syllabusId } });

      for (const mod of modulesRemote) {
        const createdMod = await target.syllabusModule.create({
          data: {
            syllabusId,
            title: mod.title,
            summary: mod.summary,
            order: mod.order,
            slug: mod.slug,
            isLocked: mod.isLocked,
            goal: mod.goal,
            duration: mod.duration,
          },
        });
        modules += 1;

        if (mod.lessons.length === 0) continue;

        await target.syllabusLesson.createMany({
          data: mod.lessons.map((lesson) => ({
            moduleId: createdMod.id,
            title: lesson.title,
            summary: lesson.summary,
            contentType: lesson.contentType,
            content: lesson.content,
            durationMin: lesson.durationMin,
            order: lesson.order,
            isPublished: lesson.isPublished,
            slug: lesson.slug,
            type: lesson.type,
            videoUrl: lesson.videoUrl,
            duration: lesson.duration,
            isFree: lesson.isFree,
            isPreview: lesson.isPreview,
            audioUrl: lesson.audioUrl,
            subtitleUrl: lesson.subtitleUrl,
            passingScore: lesson.passingScore,
            quizConfig: lesson.quizConfig ?? undefined,
            assignmentConfig: lesson.assignmentConfig ?? undefined,
            resources: lesson.resources ?? undefined,
          })),
        });
        lessons += mod.lessons.length;
      }
    }

    console.log(
      dryRun
        ? `Dry run: would update ${updated}, create ${created}, ${modules} module(s), ${lessons} lesson(s).`
        : `Done: updated ${updated}, created ${created}, ${modules} module(s), ${lessons} lesson(s).`,
    );
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
