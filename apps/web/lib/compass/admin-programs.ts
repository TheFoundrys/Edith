import "server-only";

import { prisma } from "@/lib/db";
import { mapCourseToProgram } from "@/lib/compass/courses";
import { countCompassEnrollments } from "@/lib/compass/enrollment";

type CourseAdminRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  domainId: string | null;
  domainSlug: string | null;
  thumbnail: string | null;
  price: number;
  level: Parameters<typeof mapCourseToProgram>[0]["level"];
  learningOutcomes: string[];
  tags: string[];
  type: Parameters<typeof mapCourseToProgram>[0]["type"];
  duration: string | null;
  isHybridOnly: boolean;
  isPublished: boolean;
  updatedAt: Date;
  moduleCount: bigint;
  lessonCount: bigint;
};

export type CompassAdminProgramRow = ReturnType<typeof mapCourseToProgram> & {
  updatedAt: Date;
  moduleCount: number;
  lessonCount: number;
  enrollmentCount: number;
  syllabusStatus: "PUBLISHED" | "DRAFT";
};

export async function listCompassAdminPrograms(
  domainId?: string,
): Promise<CompassAdminProgramRow[]> {
  const rows = domainId
    ? await prisma.$queryRaw<CourseAdminRow[]>`
        SELECT c.id, c.title, c.slug, c.description, c."domainId", c."domainSlug",
          c.thumbnail, c.price, c.level, c."learningOutcomes", c.tags, c.type,
          c.duration, c."isHybridOnly", c."isPublished", c."updatedAt",
          (SELECT COUNT(*)::bigint FROM "Module" m WHERE m."courseId" = c.id) AS "moduleCount",
          (SELECT COUNT(*)::bigint FROM "Lesson" l WHERE l."courseId" = c.id) AS "lessonCount"
        FROM "Course" c
        WHERE c."domainId" = ${domainId}
        ORDER BY c."updatedAt" DESC
      `
    : await prisma.$queryRaw<CourseAdminRow[]>`
        SELECT c.id, c.title, c.slug, c.description, c."domainId", c."domainSlug",
          c.thumbnail, c.price, c.level, c."learningOutcomes", c.tags, c.type,
          c.duration, c."isHybridOnly", c."isPublished", c."updatedAt",
          (SELECT COUNT(*)::bigint FROM "Module" m WHERE m."courseId" = c.id) AS "moduleCount",
          (SELECT COUNT(*)::bigint FROM "Lesson" l WHERE l."courseId" = c.id) AS "lessonCount"
        FROM "Course" c
        ORDER BY c."updatedAt" DESC
      `;

  const programs: CompassAdminProgramRow[] = [];
  for (const row of rows) {
    const enrollmentCount = await countCompassEnrollments(row.id);
    const hasContent = Number(row.lessonCount) > 0;
    programs.push({
      ...mapCourseToProgram(row),
      updatedAt: row.updatedAt,
      moduleCount: Number(row.moduleCount),
      lessonCount: Number(row.lessonCount),
      enrollmentCount,
      syllabusStatus:
        row.isPublished && hasContent ? "PUBLISHED" : "DRAFT",
    });
  }
  return programs;
}
