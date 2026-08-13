import {
  ProgramStatus,
  type Prisma,
  type ProgramCategory,
} from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { can } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  availableFinderOptions,
  parseFinderFilters,
  programMatchesFinderFilters,
  type FinderFilters,
} from "@/lib/programs/finder-filters";
import {
  catalogDurationKey,
  catalogExperienceKey,
} from "@/lib/programs/catalog-meta";
import { slugify } from "@/lib/utils";
import type {
  CatalogCoursePatch,
  CatalogCourseWrite,
} from "@/lib/catalog/schemas";
import {
  serializeAdminCourse,
  serializeAdminCourseDetail,
  serializeCatalogCourse,
  serializeCatalogCourseDetail,
  serializeCategories,
} from "@/lib/catalog/serialize";

const catalogListInclude = {
  campus: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  intakes: {
    where: { isActive: true },
    orderBy: { startDate: "asc" as const },
    select: {
      id: true,
      name: true,
      startDate: true,
      applicationOpen: true,
      applicationClose: true,
      capacity: true,
      isActive: true,
    },
  },
} satisfies Prisma.ProgramInclude;

const catalogDetailInclude = {
  ...catalogListInclude,
  syllabus: {
    where: { status: "PUBLISHED" as const },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      modules: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          title: true,
          summary: true,
          order: true,
          duration: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" as const },
            select: {
              id: true,
              title: true,
              summary: true,
              durationMin: true,
              order: true,
              isPreview: true,
              isFree: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProgramInclude;

export type CatalogListQuery = {
  suite?: string | string[];
  category?: string | string[];
  duration?: string | string[];
  experience?: string | string[];
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "name" | "updated" | "tuition";
};

function parseDocs(docs?: string[]) {
  return JSON.stringify(docs ?? []);
}

function emptyToNull(value?: string | null) {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function uniqueSlug(organizationId: string, name: string, preferred?: string) {
  const base = preferred?.trim() || slugify(name) || `course-${Date.now()}`;
  let slug = base;
  let i = 1;
  while (
    await prisma.program.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    })
  ) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function listPublishedCatalogCourses(query: CatalogListQuery) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const sort = query.sort ?? "name";

  const published = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    include: catalogListInclude,
    orderBy:
      sort === "tuition"
        ? { price: "asc" }
        : sort === "updated"
          ? { updatedAt: "desc" }
          : { title: "asc" },
  });

  const filterIndex = published.map((course) => ({
    category: course.category,
    duration: catalogDurationKey(course),
    experience: catalogExperienceKey(course),
  }));
  const available = availableFinderOptions(filterIndex);
  const filters = parseFinderFilters(
    {
      suite: query.suite,
      category: query.category,
      duration: query.duration,
      experience: query.experience,
    },
    available,
  );

  const q = query.q?.trim().toLowerCase();
  let filtered = published.filter((course) =>
    programMatchesFinderFilters(course, filters),
  );
  if (q) {
    filtered = filtered.filter((course) => {
      const haystack = [
        course.title,
        course.description ?? "",
        course.eligibilitySummary ?? "",
        ...course.tags,
        ...course.learningOutcomes,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  return {
    courses: pageItems.map(serializeCatalogCourse),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
    filters: {
      applied: filters,
      available,
    },
  };
}

export async function getPublishedCatalogCourseBySlug(slug: string) {
  const course = await prisma.program.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: catalogDetailInclude,
  });
  if (!course) return null;
  return serializeCatalogCourseDetail(course);
}

export async function getCatalogFilters() {
  const published = await prisma.program.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      category: true,
      degreeLevel: true,
      eligibilitySummary: true,
      campus: { select: { name: true } },
    },
  });

  const filterIndex = published.map((course) => ({
    category: course.category,
    duration: catalogDurationKey(course),
    experience: catalogExperienceKey(course),
  }));

  return {
    categories: serializeCategories(),
    filters: availableFinderOptions(filterIndex),
    totals: {
      published: published.length,
      bySuite: published.reduce<Record<string, number>>((acc, course) => {
        acc[course.category] = (acc[course.category] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}

export function getCatalogCategories() {
  return { categories: serializeCategories() };
}

export async function listAdminCatalogCourses(
  user: SessionUser,
  opts?: { status?: ProgramStatus; q?: string },
) {
  const where: Prisma.ProgramWhereInput = {
    organizationId: user.organizationId,
  };
  if (opts?.status) where.status = opts.status;
  if (opts?.q?.trim()) {
    where.OR = [
      { title: { contains: opts.q.trim(), mode: "insensitive" } },
      { slug: { contains: opts.q.trim(), mode: "insensitive" } },
      { description: { contains: opts.q.trim(), mode: "insensitive" } },
    ];
  }

  const courses = await prisma.program.findMany({
    where,
    include: {
      ...catalogListInclude,
      _count: { select: { applications: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return {
    courses: courses.map((course) =>
      serializeAdminCourse({
        ...course,
        formDefinitionId: course.formDefinitionId,
        crmCatalogId: course.crmCatalogId,
        requiresCrmCallback: course.requiresCrmCallback,
        capacity: course.capacity,
      }),
    ),
  };
}

export async function getAdminCatalogCourse(user: SessionUser, id: string) {
  const course = await prisma.program.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      campus: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      intakes: {
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          applicationOpen: true,
          applicationClose: true,
          capacity: true,
          isActive: true,
        },
      },
      syllabus: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              order: true,
              duration: true,
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  durationMin: true,
                  order: true,
                  isPreview: true,
                  isFree: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { applications: true, enrollments: true } },
    },
  });
  if (!course) return null;
  return serializeAdminCourseDetail({
    ...course,
    formDefinitionId: course.formDefinitionId,
    crmCatalogId: course.crmCatalogId,
    requiresCrmCallback: course.requiresCrmCallback,
    capacity: course.capacity,
  });
}

export async function createAdminCatalogCourse(
  user: SessionUser,
  data: CatalogCourseWrite,
) {
  if (!can(user.role, "managePricing") && (data.price != null || data.applicationFee != null)) {
    return { ok: false as const, error: "You do not have permission to set course pricing.", status: 403 as const };
  }

  const slug = await uniqueSlug(user.organizationId, data.name, data.slug);
  const status = data.status ?? ProgramStatus.DRAFT;

  const course = await prisma.program.create({
    data: {
      organizationId: user.organizationId,
      title: data.name,
      slug,
      category: data.category,
      degreeLevel: data.degreeLevel,
      description: emptyToNull(data.summary),
      eligibilitySummary: emptyToNull(data.eligibilitySummary),
      imageUrl: emptyToNull(data.imageUrl),
      price: data.price ?? null,
      tuitionCurrency: data.tuitionCurrency ?? "INR",
      capacity: data.capacity ?? null,
      applicationFee: data.applicationFee ?? null,
      campusId: data.campusId ?? null,
      departmentId: data.departmentId ?? null,
      formDefinitionId: data.formDefinitionId ?? null,
      requiredDocs: parseDocs(data.requiredDocs),
      crmCatalogId: emptyToNull(data.crmCatalogId),
      requiresCrmCallback: data.requiresCrmCallback ?? false,
      learningOutcomes: data.learningOutcomes ?? [],
      tags: data.tags ?? [],
      duration: emptyToNull(data.duration),
      brochureUrl: emptyToNull(data.brochureUrl),
      status,
      publishedAt: status === ProgramStatus.PUBLISHED ? new Date() : null,
    },
    include: {
      ...catalogListInclude,
      _count: { select: { applications: true, enrollments: true } },
    },
  });

  return {
    ok: true as const,
    course: serializeAdminCourse({
      ...course,
      formDefinitionId: course.formDefinitionId,
      crmCatalogId: course.crmCatalogId,
      requiresCrmCallback: course.requiresCrmCallback,
      capacity: course.capacity,
    }),
  };
}

export async function updateAdminCatalogCourse(
  user: SessionUser,
  id: string,
  data: CatalogCoursePatch,
) {
  const existing = await prisma.program.findFirst({
    where: { id, organizationId: user.organizationId },
  });
  if (!existing) return { ok: false as const, error: "Course not found.", status: 404 as const };

  const allowPricing = can(user.role, "managePricing");
  if (
    !allowPricing &&
    (data.price !== undefined ||
      data.applicationFee !== undefined ||
      data.tuitionCurrency !== undefined)
  ) {
    return { ok: false as const, error: "You do not have permission to set course pricing.", status: 403 as const };
  }

  if (data.slug && data.slug !== existing.slug) {
    const clash = await prisma.program.findUnique({
      where: {
        organizationId_slug: {
          organizationId: user.organizationId,
          slug: data.slug,
        },
      },
    });
    if (clash) {
      return { ok: false as const, error: "Slug already in use.", status: 409 as const };
    }
  }

  const course = await prisma.program.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined ? { slug: data.slug } : {}),
      ...(data.category !== undefined
        ? { category: data.category as ProgramCategory }
        : {}),
      ...(data.degreeLevel !== undefined ? { degreeLevel: data.degreeLevel } : {}),
      ...(data.summary !== undefined ? { summary: emptyToNull(data.summary) } : {}),
      ...(data.eligibilitySummary !== undefined
        ? { eligibilitySummary: emptyToNull(data.eligibilitySummary) }
        : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: emptyToNull(data.imageUrl) } : {}),
      ...(allowPricing && data.price !== undefined
        ? { price: data.price }
        : {}),
      ...(allowPricing && data.tuitionCurrency !== undefined
        ? { tuitionCurrency: data.tuitionCurrency }
        : {}),
      ...(allowPricing && data.applicationFee !== undefined
        ? { applicationFee: data.applicationFee }
        : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.campusId !== undefined ? { campusId: data.campusId } : {}),
      ...(data.departmentId !== undefined ? { departmentId: data.departmentId } : {}),
      ...(data.formDefinitionId !== undefined
        ? { formDefinitionId: data.formDefinitionId }
        : {}),
      ...(data.requiredDocs !== undefined
        ? { requiredDocs: parseDocs(data.requiredDocs) }
        : {}),
      ...(data.crmCatalogId !== undefined
        ? { crmCatalogId: emptyToNull(data.crmCatalogId) }
        : {}),
      ...(data.requiresCrmCallback !== undefined
        ? { requiresCrmCallback: data.requiresCrmCallback }
        : {}),
      ...(data.learningOutcomes !== undefined
        ? { learningOutcomes: data.learningOutcomes }
        : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.duration !== undefined ? { duration: emptyToNull(data.duration) } : {}),
      ...(data.brochureUrl !== undefined
        ? { brochureUrl: emptyToNull(data.brochureUrl) }
        : {}),
    },
    include: {
      ...catalogListInclude,
      _count: { select: { applications: true, enrollments: true } },
    },
  });

  return {
    ok: true as const,
    course: serializeAdminCourse({
      ...course,
      formDefinitionId: course.formDefinitionId,
      crmCatalogId: course.crmCatalogId,
      requiresCrmCallback: course.requiresCrmCallback,
      capacity: course.capacity,
    }),
  };
}

export async function setAdminCatalogCourseStatus(
  user: SessionUser,
  id: string,
  status: ProgramStatus,
) {
  const program = await prisma.program.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      formDefinition: {
        include: { versions: { where: { isPublished: true } } },
      },
    },
  });
  if (!program) return { ok: false as const, error: "Course not found.", status: 404 as const };

  if (status === ProgramStatus.PUBLISHED) {
    if (!program.formDefinitionId || !program.formDefinition?.versions.length) {
      return {
        ok: false as const,
        error: "Attach a published application form before publishing.",
        status: 400 as const,
      };
    }
  }

  const course = await prisma.program.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === ProgramStatus.PUBLISHED
          ? program.publishedAt ?? new Date()
          : program.publishedAt,
    },
    include: {
      ...catalogListInclude,
      _count: { select: { applications: true, enrollments: true } },
    },
  });

  return {
    ok: true as const,
    course: serializeAdminCourse({
      ...course,
      formDefinitionId: course.formDefinitionId,
      crmCatalogId: course.crmCatalogId,
      requiresCrmCallback: course.requiresCrmCallback,
      capacity: course.capacity,
    }),
  };
}

export type { FinderFilters };
