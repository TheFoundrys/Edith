import "server-only";

import type { Prisma, ProgramCategory } from "@prisma/client";
import {
  getCompassPublishedProgramBySlug,
  loadCompassSyllabus,
} from "@/lib/compass/catalog";
import { getCompassCatalogDomainFilter } from "@/lib/compass/domain";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getDefaultOrganizationId } from "@/lib/organizations/default";

const courseLandingInclude = {
  campus: true,
  department: true,
  intakes: { where: { isActive: true }, orderBy: { startDate: "asc" as const } },
  _count: { select: { enrollments: true } },
  syllabus: {
    where: { status: "PUBLISHED" as const },
    select: {
      title: true,
      modules: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          title: true,
          summary: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" as const },
            select: {
              id: true,
              title: true,
              durationMin: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProgramInclude;

export type PublicCourseLandingSource = Prisma.ProgramGetPayload<{
  include: typeof courseLandingInclude;
}>;

async function normalizeCompassLandingCourse(
  course: NonNullable<Awaited<ReturnType<typeof getCompassPublishedProgramBySlug>>>,
): Promise<PublicCourseLandingSource> {
  const syllabus = await loadCompassSyllabus(course.id);

  return {
    ...course,
    campus: course.campus ?? null,
    department: course.department ?? null,
    intakes: course.intakes ?? [],
    formDefinitionId: course.formDefinitionId ?? null,
    requiresCrmCallback: course.requiresCrmCallback ?? false,
    _count: course._count ?? { enrollments: 0 },
    syllabus: syllabus
      ? {
          title: syllabus.title,
          modules: syllabus.modules.map((mod) => ({
            id: mod.id,
            title: mod.title,
            summary: mod.summary,
            lessons: mod.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              durationMin: lesson.durationMin,
            })),
          })),
        }
      : null,
  } as PublicCourseLandingSource;
}

/** Published course payload for marketing landing / intake pages. */
export async function loadPublicCourseLandingSource(
  slug: string,
  organizationId?: string,
): Promise<PublicCourseLandingSource | null> {
  const orgId = organizationId ?? (await getDefaultOrganizationId());

  if (isCompassDatabase()) {
    const domainId = orgId || (await getCompassCatalogDomainFilter());
    const course = await getCompassPublishedProgramBySlug(slug, domainId);
    if (!course) return null;
    return normalizeCompassLandingCourse(course);
  }

  return prisma.program.findFirst({
    where: { organizationId: orgId, slug, status: "PUBLISHED" },
    include: courseLandingInclude,
  });
}

export async function loadPublishedProgramsBySlugs(
  slugs: string[],
  organizationId: string,
): Promise<{ slug: string; title: string; category: ProgramCategory }[]> {
  if (slugs.length === 0) return [];

  if (isCompassDatabase()) {
    const domainId =
      organizationId || (await getCompassCatalogDomainFilter());
    const programs = await Promise.all(
      slugs.map((slug) => getCompassPublishedProgramBySlug(slug, domainId)),
    );
    return programs
      .filter((program): program is NonNullable<typeof program> => program != null)
      .map((program) => ({
        slug: program.slug,
        title: program.title,
        category: program.category,
      }));
  }

  return prisma.program.findMany({
    where: {
      organizationId,
      slug: { in: slugs },
      status: "PUBLISHED",
    },
    select: { slug: true, title: true, category: true },
  });
}
