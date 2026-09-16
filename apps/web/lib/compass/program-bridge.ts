import "server-only";

import type { ProgramCategory, ProgramStatus } from "@prisma/client";
import { listCompassAdminPrograms } from "@/lib/compass/admin-programs";
import { getCompassCatalogDomainFilter } from "@/lib/compass/domain";
import {
  getCompassCourseById,
  getCompassCourseBySlug,
  searchCompassCourses,
} from "@/lib/compass/courses";
import { getCompassPublishedProgramBySlug } from "@/lib/compass/catalog";
import { isCompassDatabase } from "@/lib/db/profile";
import { prisma } from "@/lib/db";

export type StaffProgramOption = {
  id: string;
  title: string;
  slug?: string;
  status?: ProgramStatus;
  category?: ProgramCategory;
  sku?: string | null;
  domainSlug?: string | null;
};

/** Program/course picklists for admin forms (Compass Course ↔ Edith Program). */
export async function listStaffProgramOptions(
  organizationId: string,
): Promise<StaffProgramOption[]> {
  if (isCompassDatabase()) {
    const courses = await listCompassAdminPrograms(organizationId);
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      category: course.category,
      sku: course.sku,
      domainSlug: course.domainSlug,
    }));
  }

  return prisma.program.findMany({
    where: { organizationId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      sku: true,
      domainSlug: true,
    },
    orderBy: { title: "asc" },
  });
}

export async function searchStaffPrograms(
  organizationId: string,
  query: string,
  options?: { staffCanViewDrafts?: boolean; limit?: number },
): Promise<StaffProgramOption[]> {
  if (isCompassDatabase()) {
    const courses = await searchCompassCourses(query, {
      domainId: organizationId,
      publishedOnly: !options?.staffCanViewDrafts,
      limit: options?.limit ?? 8,
    });
    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      slug: course.slug,
      status: course.status,
      category: course.category,
      sku: course.sku,
      domainSlug: course.domainSlug,
    }));
  }

  return prisma.program.findMany({
    where: {
      organizationId,
      ...(options?.staffCanViewDrafts ? {} : { status: "PUBLISHED" }),
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    },
    take: options?.limit ?? 8,
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      sku: true,
      domainSlug: true,
      status: true,
    },
  });
}

export type ResolvedPublishedProgram = NonNullable<
  Awaited<ReturnType<typeof resolvePublishedProgramBySlug>>
>;

type NamedRelation = { name: string } | null | undefined;

export type PublishedProgramIntake = {
  id: string;
  name: string;
  startDate: Date | null;
};

/** Resolve a published program/course by slug in either DB profile. */
export async function resolvePublishedProgramBySlug(
  slug: string,
  organizationId?: string,
) {
  if (isCompassDatabase()) {
    const domainId = organizationId ?? (await getCompassCatalogDomainFilter());
    return getCompassCourseBySlug(slug, domainId) ?? getCompassCourseBySlug(slug);
  }
  return prisma.program.findFirst({
    where: {
      ...(organizationId ? { organizationId } : {}),
      slug,
      status: "PUBLISHED",
    },
    include: {
      campus: true,
      department: true,
      intakes: {
        where: { isActive: true },
        orderBy: { startDate: "asc" },
      },
    },
  });
}

export function publishedProgramDepartmentName(
  program: ResolvedPublishedProgram,
): string | null {
  const department = (program as { department?: NamedRelation }).department;
  return department?.name ?? null;
}

export function publishedProgramCampusName(
  program: ResolvedPublishedProgram,
): string | null {
  const campus = (program as { campus?: NamedRelation }).campus;
  return campus?.name ?? null;
}

export function publishedProgramIntakes(
  program: ResolvedPublishedProgram,
): PublishedProgramIntake[] {
  const intakes = (
    program as { intakes?: PublishedProgramIntake[] }
  ).intakes;
  return intakes ?? [];
}

/** Staff-scoped program/course lookup (no relations). */
export async function resolveStaffProgram(
  programId: string,
  organizationId: string,
) {
  if (isCompassDatabase()) {
    const course = await getCompassCourseById(programId);
    if (!course || course.organizationId !== organizationId) return null;
    return course;
  }
  return prisma.program.findFirst({
    where: { id: programId, organizationId },
  });
}

export async function resolveProgramById(programId: string, organizationId?: string) {
  if (isCompassDatabase()) {
    return getCompassCourseById(programId);
  }
  return prisma.program.findFirst({
    where: {
      id: programId,
      ...(organizationId ? { organizationId } : {}),
    },
    include: {
      intakes: {
        where: { isActive: true },
        orderBy: { startDate: "asc" },
      },
    },
  });
}

export async function resolvePublishedCatalogDetail(slug: string, organizationId?: string) {
  if (isCompassDatabase()) {
    const domainId = organizationId ?? (await getCompassCatalogDomainFilter());
    return getCompassPublishedProgramBySlug(slug, domainId);
  }
  return null;
}
