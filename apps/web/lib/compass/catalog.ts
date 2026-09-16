import "server-only";

import {
  CourseLevel,
  CourseType,
  DegreeLevel,
  ProgramCategory,
  ProgramKind,
  ProgramStatus,
  SyllabusStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PublishedCatalogProgram } from "@/lib/catalog/service";

type CompassCourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  domainId: string | null;
  thumbnail: string | null;
  price: number;
  level: CourseLevel;
  learningOutcomes: string[];
  tags: string[];
  type: CourseType;
  duration: string | null;
  isHybridOnly: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CompassModuleRow = {
  id: string;
  title: string;
  goal: string | null;
  order: number;
  duration: string | null;
};

type CompassLessonRow = {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  duration: string | null;
  order: number;
  isFree: boolean;
  isPreview: boolean;
};

function domainCategory(slug: string | null): ProgramCategory {
  if (slug === "undergraduate" || slug?.includes("degree")) {
    return "UNDERGRADUATE_DEGREE";
  }
  return "CERTIFICATION";
}

type CompassSyllabusOutline = {
  id: string;
  title: string | null;
  description: string | null;
  status: SyllabusStatus;
  modules: {
    id: string;
    title: string;
    summary: string | null;
    order: number;
    duration: string | null;
    lessons: {
      id: string;
      title: string;
      summary: string | null;
      durationMin: number | null;
      order: number;
      isPreview: boolean;
      isFree: boolean;
    }[];
  }[];
};

function mapCourseRow(
  row: CompassCourseRow,
  enrollmentCount = 0,
  syllabus: CompassSyllabusOutline | null = null,
): PublishedCatalogProgram {
  return {
    id: row.id,
    organizationId: row.domainId ?? "",
    campusId: null,
    departmentId: null,
    formDefinitionId: null,
    title: row.title,
    slug: row.slug,
    category: domainCategory(null),
    degreeLevel: DegreeLevel.CERTIFICATE,
    description: row.description,
    eligibilitySummary: null,
    imageUrl: row.thumbnail,
    price: row.price,
    tuitionCurrency: "INR",
    capacity: null,
    applicationFee: null,
    requiredDocs: "[]",
    crmCatalogId: null,
    requiresCrmCallback: false,
    status: ProgramStatus.PUBLISHED,
    programKind: ProgramKind.COURSE,
    sku: null,
    isInventoryOnly: false,
    batchId: null,
    domainSlug: null,
    domain: null,
    duration: row.duration,
    originalPrice: null,
    level: row.level,
    learningOutcomes: row.learningOutcomes ?? [],
    pricing: null,
    tags: row.tags ?? [],
    type: row.type,
    weeks: null,
    batchStartDate: null,
    isHybridOnly: row.isHybridOnly,
    publishedAt: row.publishedAt,
    lastDraftSave: null,
    curriculum: null,
    draftCurriculum: null,
    certificateTemplateId: null,
    specialization: null,
    location: null,
    brochureUrl: null,
    requiresEntranceExam: false,
    durationYears: null,
    semestersPerYear: null,
    cautionDeposit: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    campus: null,
    department: null,
    intakes: [],
    _count: { enrollments: enrollmentCount },
    syllabus,
  } as PublishedCatalogProgram;
}

export async function loadCompassSyllabus(courseId: string) {
  const modules = await prisma.$queryRaw<CompassModuleRow[]>`
    SELECT id, title, goal, "order", duration
    FROM "Module"
    WHERE "courseId" = ${courseId}
    ORDER BY "order" ASC
  `;
  if (modules.length === 0) return null;

  const lessons = await prisma.$queryRaw<CompassLessonRow[]>`
    SELECT id, "moduleId", title, content, duration, "order", "isFree", "isPreview"
    FROM "Lesson"
    WHERE "courseId" = ${courseId}
    ORDER BY "order" ASC
  `;

  const lessonsByModule = new Map<string, CompassLessonRow[]>();
  for (const lesson of lessons) {
    const bucket = lessonsByModule.get(lesson.moduleId) ?? [];
    bucket.push(lesson);
    lessonsByModule.set(lesson.moduleId, bucket);
  }

  return {
    id: `syllabus-${courseId}`,
    title: null,
    description: null,
    status: SyllabusStatus.PUBLISHED,
    modules: modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      summary: mod.goal,
      order: mod.order,
      duration: mod.duration,
      lessons: (lessonsByModule.get(mod.id) ?? []).map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        summary: lesson.content?.slice(0, 160) ?? null,
        durationMin: null,
        order: lesson.order,
        isPreview: lesson.isPreview,
        isFree: lesson.isFree,
      })),
    })),
  };
}

export async function loadCompassPublishedPrograms(options?: {
  domainId?: string;
  sort?: "name" | "tuition" | "updated";
}): Promise<PublishedCatalogProgram[]> {
  const domainId = options?.domainId;
  const orderSql =
    options?.sort === "tuition"
      ? `ORDER BY price ASC, title ASC`
      : options?.sort === "updated"
        ? `ORDER BY "updatedAt" DESC`
        : `ORDER BY title ASC`;

  const rows = domainId
    ? await prisma.$queryRawUnsafe<CompassCourseRow[]>(
        `SELECT id, title, slug, description, "domainId", thumbnail, price, level,
                "learningOutcomes", tags, type, duration, "isHybridOnly",
                "publishedAt", "createdAt", "updatedAt"
         FROM "Course"
         WHERE "isPublished" = true AND "domainId" = $1
         ${orderSql}`,
        domainId,
      )
    : await prisma.$queryRawUnsafe<CompassCourseRow[]>(
        `SELECT id, title, slug, description, "domainId", thumbnail, price, level,
                "learningOutcomes", tags, type, duration, "isHybridOnly",
                "publishedAt", "createdAt", "updatedAt"
         FROM "Course"
         WHERE "isPublished" = true
         ${orderSql}`,
      );

  return rows.map((row) => mapCourseRow(row));
}

export async function getCompassPublishedProgramBySlug(
  slug: string,
  domainId?: string,
): Promise<PublishedCatalogProgram | null> {
  const rows = domainId
    ? await prisma.$queryRaw<CompassCourseRow[]>`
        SELECT id, title, slug, description, "domainId", thumbnail, price, level,
               "learningOutcomes", tags, type, duration, "isHybridOnly",
               "publishedAt", "createdAt", "updatedAt"
        FROM "Course"
        WHERE slug = ${slug} AND "isPublished" = true AND "domainId" = ${domainId}
        LIMIT 1
      `
    : await prisma.$queryRaw<CompassCourseRow[]>`
        SELECT id, title, slug, description, "domainId", thumbnail, price, level,
               "learningOutcomes", tags, type, duration, "isHybridOnly",
               "publishedAt", "createdAt", "updatedAt"
        FROM "Course"
        WHERE slug = ${slug} AND "isPublished" = true
        LIMIT 1
      `;

  const row = rows[0];
  if (!row) return null;

  const counts = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Enrollment"
    WHERE "courseId" = ${row.id} AND status IN ('ACTIVE', 'COMPLETED')
  `;
  const enrollmentCount = Number(counts[0]?.count ?? 0);
  const syllabus = await loadCompassSyllabus(row.id);
  return mapCourseRow(row, enrollmentCount, syllabus);
}
