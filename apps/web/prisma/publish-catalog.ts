/**
 * Publishes the catalogue in prisma/catalog-data.ts to a live database.
 *
 * ADDITIVE ONLY. This script issues no delete of any kind, which is what makes
 * it safe on production where prisma/seed.ts is not: the seeder opens by
 * dropping every user, organization, programme, application and payment.
 *
 * Default behaviour is create-only — a programme that already exists is left
 * exactly as it is, so nothing an administrator edited in the admin UI is
 * overwritten. Pass --update to also refresh descriptive fields on existing
 * programmes.
 *
 *   npx tsx prisma/publish-catalog.ts --dry-run     # report, write nothing
 *   npx tsx prisma/publish-catalog.ts               # create missing courses
 *   npx tsx prisma/publish-catalog.ts --update      # also refresh existing
 *   npx tsx prisma/publish-catalog.ts --org=the-foundrys
 */
import {
  PrismaClient,
  ProgramKind,
  ProgramStatus,
  SyllabusStatus,
} from "@prisma/client";
import { FOUNDRYS_PROGRAMS, type SeedProgram } from "./catalog-data";

const prisma = new PrismaClient();

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const allowUpdate = argv.includes("--update");
const orgSlugArg = argv
  .find((a) => a.startsWith("--org="))
  ?.slice("--org=".length);

const CAMPUS_SPECS = [
  { code: "HYD", name: "Hyderabad Campus", city: "Hyderabad" },
  { code: "WGL", name: "Warangal Campus", city: "Warangal" },
] as const;

const DEPARTMENT_SPECS = [
  { code: "AI", name: "School of Artificial Intelligence" },
  { code: "CYBER", name: "School of Cyber Security" },
  { code: "DS", name: "School of Data Science" },
  { code: "CHAIN", name: "School of Blockchain" },
  { code: "QC", name: "School of Quantum Computing" },
  { code: "ROBOTICS", name: "School of Robotics & IoT" },
  { code: "ESG", name: "School of ESG & Sustainability" },
  { code: "ENERGY", name: "School of Renewable Energy" },
  { code: "VENTURE", name: "School of Entrepreneurship" },
  { code: "EDU", name: "Faculty Development" },
  { code: "EXEC", name: "Executive Education" },
  { code: "AMP", name: "Advanced Management" },
] as const;

async function resolveOrganization() {
  const slug = orgSlugArg ?? process.env.DEFAULT_ORG_SLUG;

  if (slug) {
    const org = await prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      throw new Error(
        `No organization with slug "${slug}". Pass --org=<slug> or set DEFAULT_ORG_SLUG.`,
      );
    }
    return org;
  }

  const all = await prisma.organization.findMany({ take: 2 });
  if (all.length === 1) return all[0];
  if (all.length === 0) throw new Error("This database has no organization.");
  throw new Error(
    "Several organizations exist. Choose one with --org=<slug> or DEFAULT_ORG_SLUG.",
  );
}

/** Campus and Department have no unique index on (organizationId, code). */
async function ensureCampuses(organizationId: string) {
  const byCode: Record<string, string> = {};
  for (const spec of CAMPUS_SPECS) {
    const existing = await prisma.campus.findFirst({
      where: { organizationId, code: spec.code },
    });
    if (existing) {
      byCode[spec.code] = existing.id;
      continue;
    }
    console.log(`  + campus ${spec.code} (${spec.name})`);
    if (dryRun) continue;
    const created = await prisma.campus.create({
      data: {
        organizationId,
        name: spec.name,
        code: spec.code,
        city: spec.city,
        country: "India",
      },
    });
    byCode[spec.code] = created.id;
  }
  return byCode;
}

async function ensureDepartments(organizationId: string) {
  const byCode: Record<string, string> = {};
  for (const spec of DEPARTMENT_SPECS) {
    const existing = await prisma.department.findFirst({
      where: { organizationId, code: spec.code },
    });
    if (existing) {
      byCode[spec.code] = existing.id;
      continue;
    }
    console.log(`  + department ${spec.code} (${spec.name})`);
    if (dryRun) continue;
    const created = await prisma.department.create({
      data: { organizationId, name: spec.name, code: spec.code },
    });
    byCode[spec.code] = created.id;
  }
  return byCode;
}

/**
 * Reuses whatever application form the organization already publishes. This
 * script deliberately does not invent one: the form schema is owned by the
 * admin UI, and a course without a form still lists, it just cannot take
 * applications until an administrator attaches one.
 */
async function findApplicationForm(organizationId: string) {
  const form = await prisma.formDefinition.findFirst({
    where: {
      organizationId,
      versions: { some: { isPublished: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (!form) {
    console.warn(
      "  ! no published application form on this organization — new courses " +
        "will list but cannot accept applications until one is attached",
    );
  }
  return form;
}

function programCreateData(
  program: SeedProgram,
  ids: {
    organizationId: string;
    campusId: string | null;
    departmentId: string | null;
    formDefinitionId: string | null;
  },
) {
  return {
    organizationId: ids.organizationId,
    campusId: ids.campusId,
    departmentId: ids.departmentId,
    formDefinitionId: ids.formDefinitionId,
    title: program.name,
    slug: program.slug,
    category: program.category,
    degreeLevel: program.degreeLevel,
    description: program.summary,
    eligibilitySummary: program.eligibilitySummary,
    price: program.price,
    tuitionCurrency: "INR",
    capacity: program.capacity,
    applicationFee: program.applicationFee,
    requiredDocs: JSON.stringify(program.requiredDocs),
    crmCatalogId: program.crmCatalogId ?? null,
    status: ProgramStatus.PUBLISHED,
    publishedAt: new Date(),
    programKind: program.programKind ?? ProgramKind.COURSE,
    sku: program.sku ?? null,
    duration: program.duration ?? null,
    weeks: program.weeks ?? null,
    durationYears: program.durationYears ?? null,
    semestersPerYear: program.semestersPerYear ?? null,
    level: program.level ?? null,
    type: program.type ?? null,
    location: program.location ?? null,
    specialization: program.specialization ?? null,
    domainSlug: program.domainSlug ?? null,
    isHybridOnly: program.isHybridOnly ?? false,
    requiresEntranceExam: program.requiresEntranceExam ?? false,
    tags: program.tags ?? [],
    learningOutcomes: program.learningOutcomes ?? [],
    pricing: program.pricing ?? undefined,
    ...(program.modules?.length
      ? {
          syllabus: {
            create: {
              title: program.syllabusTitle ?? "Course outline",
              description: null,
              status: SyllabusStatus.PUBLISHED,
              modules: {
                create: program.modules.map((mod, moduleIndex) => ({
                  title: mod.title,
                  summary: mod.summary,
                  order: moduleIndex,
                  ...(mod.lessons?.length
                    ? {
                        lessons: {
                          create: mod.lessons.map((lesson, lessonIndex) => ({
                            title: lesson.title,
                            summary: lesson.summary,
                            contentType: lesson.contentType,
                            content: lesson.content,
                            durationMin: lesson.durationMin,
                            order: lessonIndex,
                            isPublished: true,
                          })),
                        },
                      }
                    : {}),
                })),
              },
            },
          },
        }
      : {}),
    intakes: {
      create: [
        {
          name: "Fall 2026",
          startDate: new Date("2026-09-01"),
          applicationOpen: new Date("2026-01-01"),
          applicationClose: new Date("2026-07-31"),
          capacity: program.capacity,
          isActive: true,
        },
        {
          name: "Spring 2027",
          startDate: new Date("2027-01-15"),
          applicationOpen: new Date("2026-08-01"),
          applicationClose: new Date("2026-11-30"),
          capacity: Math.round(program.capacity * 0.7),
          isActive: true,
        },
      ],
    },
  };
}

/**
 * Descriptive fields only. `status` is excluded so this never republishes a
 * course an administrator archived, and price / applicationFee are excluded
 * because pricing sits behind its own `managePricing` permission and is
 * routinely adjusted per environment.
 */
function programUpdateData(program: SeedProgram) {
  return {
    title: program.name,
    category: program.category,
    degreeLevel: program.degreeLevel,
    description: program.summary,
    eligibilitySummary: program.eligibilitySummary,
    requiredDocs: JSON.stringify(program.requiredDocs),
    programKind: program.programKind ?? ProgramKind.COURSE,
    sku: program.sku ?? null,
    duration: program.duration ?? null,
    weeks: program.weeks ?? null,
    durationYears: program.durationYears ?? null,
    semestersPerYear: program.semestersPerYear ?? null,
    level: program.level ?? null,
    type: program.type ?? null,
    location: program.location ?? null,
    specialization: program.specialization ?? null,
    domainSlug: program.domainSlug ?? null,
    isHybridOnly: program.isHybridOnly ?? false,
    requiresEntranceExam: program.requiresEntranceExam ?? false,
    tags: program.tags ?? [],
    learningOutcomes: program.learningOutcomes ?? [],
    pricing: program.pricing ?? undefined,
  };
}

async function main() {
  const org = await resolveOrganization();
  console.log(
    `Publishing ${FOUNDRYS_PROGRAMS.length} catalogue courses to "${org.slug}"` +
      `${dryRun ? "  [DRY RUN — nothing will be written]" : ""}`,
  );
  console.log(
    allowUpdate
      ? "Existing courses: descriptive fields will be refreshed (status and pricing untouched)"
      : "Existing courses: left untouched (pass --update to refresh them)",
  );

  console.log("\nPrerequisites");
  const campusByCode = await ensureCampuses(org.id);
  const deptByCode = await ensureDepartments(org.id);
  const form = await findApplicationForm(org.id);

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  console.log("\nCourses");
  for (const program of FOUNDRYS_PROGRAMS) {
    const existing = await prisma.program.findUnique({
      where: {
        organizationId_slug: { organizationId: org.id, slug: program.slug },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      if (!allowUpdate) {
        skipped.push(program.slug);
        continue;
      }
      console.log(`  ~ ${program.slug}`);
      if (!dryRun) {
        await prisma.program.update({
          where: { id: existing.id },
          data: programUpdateData(program),
        });
      }
      updated.push(program.slug);
      continue;
    }

    const departmentId = deptByCode[program.departmentCode] ?? null;
    if (!departmentId && !dryRun) {
      throw new Error(
        `Department "${program.departmentCode}" missing for ${program.slug}.`,
      );
    }

    console.log(`  + ${program.slug}  (${program.category})`);
    if (!dryRun) {
      await prisma.program.create({
        data: programCreateData(program, {
          organizationId: org.id,
          campusId: program.campusCode
            ? (campusByCode[program.campusCode] ?? null)
            : null,
          departmentId,
          formDefinitionId: form?.id ?? null,
        }),
      });
    }
    created.push(program.slug);
  }

  console.log(
    `\ncreated ${created.length} · updated ${updated.length} · unchanged ${skipped.length}`,
  );
  if (dryRun) console.log("DRY RUN — no changes were written.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
