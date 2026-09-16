import "server-only";

import {
  DegreeLevel,
  ProgramCategory,
  ProgramKind,
  ProgramStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CompassProgramView } from "@/lib/compass/types";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  domainId: string | null;
  domainSlug: string | null;
  thumbnail: string | null;
  price: number;
  level: CompassProgramView["level"];
  learningOutcomes: string[];
  tags: string[];
  type: CompassProgramView["type"];
  duration: string | null;
  isHybridOnly: boolean;
  isPublished: boolean;
};

const COURSE_SELECT = `
  id, title, slug, description, "domainId", "domainSlug", thumbnail, price,
  level, "learningOutcomes", tags, type, duration, "isHybridOnly", "isPublished"
`;

export function mapCourseToProgram(row: CourseRow): CompassProgramView {
  return {
    id: row.id,
    organizationId: row.domainId ?? "",
    title: row.title,
    slug: row.slug,
    description: row.description,
    eligibilitySummary: null,
    imageUrl: row.thumbnail,
    price: row.price,
    tuitionCurrency: "INR",
    status: row.isPublished ? ProgramStatus.PUBLISHED : ProgramStatus.DRAFT,
    category: ProgramCategory.CERTIFICATION,
    degreeLevel: DegreeLevel.CERTIFICATE,
    programKind: ProgramKind.COURSE,
    requiresCrmCallback: false,
    formDefinitionId: null,
    capacity: null,
    domainSlug: row.domainSlug,
    sku: null,
    level: row.level,
    duration: row.duration,
    learningOutcomes: row.learningOutcomes ?? [],
    tags: row.tags ?? [],
    type: row.type,
    isHybridOnly: row.isHybridOnly,
    intakes: [],
  };
}

export async function getCompassCourseById(
  courseId: string,
): Promise<CompassProgramView | null> {
  const rows = await prisma.$queryRawUnsafe<CourseRow[]>(
    `SELECT ${COURSE_SELECT} FROM "Course" WHERE id = $1 LIMIT 1`,
    courseId,
  );
  return rows[0] ? mapCourseToProgram(rows[0]) : null;
}

export async function getCompassCourseBySlug(
  slug: string,
  domainId?: string,
): Promise<CompassProgramView | null> {
  const rows = domainId
    ? await prisma.$queryRawUnsafe<CourseRow[]>(
        `SELECT ${COURSE_SELECT} FROM "Course" WHERE slug = $1 AND "domainId" = $2 LIMIT 1`,
        slug,
        domainId,
      )
    : await prisma.$queryRawUnsafe<CourseRow[]>(
        `SELECT ${COURSE_SELECT} FROM "Course" WHERE slug = $1 LIMIT 1`,
        slug,
      );
  return rows[0] ? mapCourseToProgram(rows[0]) : null;
}

export async function searchCompassCourses(
  query: string,
  options?: { domainId?: string; publishedOnly?: boolean; limit?: number },
): Promise<CompassProgramView[]> {
  const limit = options?.limit ?? 8;
  const pattern = `%${query.trim()}%`;
  const publishedOnly = options?.publishedOnly ?? true;
  const domainId = options?.domainId;

  const rows = domainId
    ? publishedOnly
      ? await prisma.$queryRawUnsafe<CourseRow[]>(
          `SELECT ${COURSE_SELECT} FROM "Course"
           WHERE "domainId" = $1 AND "isPublished" = true
             AND (title ILIKE $2 OR description ILIKE $2 OR slug ILIKE $2)
           ORDER BY title ASC LIMIT $3`,
          domainId,
          pattern,
          limit,
        )
      : await prisma.$queryRawUnsafe<CourseRow[]>(
          `SELECT ${COURSE_SELECT} FROM "Course"
           WHERE "domainId" = $1
             AND (title ILIKE $2 OR description ILIKE $2 OR slug ILIKE $2)
           ORDER BY title ASC LIMIT $3`,
          domainId,
          pattern,
          limit,
        )
    : publishedOnly
      ? await prisma.$queryRawUnsafe<CourseRow[]>(
          `SELECT ${COURSE_SELECT} FROM "Course"
           WHERE "isPublished" = true
             AND (title ILIKE $1 OR description ILIKE $1 OR slug ILIKE $1)
           ORDER BY title ASC LIMIT $2`,
          pattern,
          limit,
        )
      : await prisma.$queryRawUnsafe<CourseRow[]>(
          `SELECT ${COURSE_SELECT} FROM "Course"
           WHERE title ILIKE $1 OR description ILIKE $1 OR slug ILIKE $1
           ORDER BY title ASC LIMIT $2`,
          pattern,
          limit,
        );

  return rows.map(mapCourseToProgram);
}

export async function listCompassCoursesForDomain(
  domainId?: string,
): Promise<CompassProgramView[]> {
  const rows = domainId
    ? await prisma.$queryRawUnsafe<CourseRow[]>(
        `SELECT ${COURSE_SELECT} FROM "Course" WHERE "isPublished" = true AND "domainId" = $1 ORDER BY title ASC`,
        domainId,
      )
    : await prisma.$queryRawUnsafe<CourseRow[]>(
        `SELECT ${COURSE_SELECT} FROM "Course" WHERE "isPublished" = true ORDER BY title ASC`,
      );
  return rows.map(mapCourseToProgram);
}
