import "server-only";

import { LessonContentType, SyllabusStatus } from "@prisma/client";
import { loadCompassSyllabus } from "@/lib/compass/catalog";
import { getCompassCourseById } from "@/lib/compass/courses";
import { mapCompassLessonFields } from "@/lib/compass/syllabus";
import { prisma } from "@/lib/db";

type LessonRow = {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  videoUrl: string | null;
  order: number;
};

function mapCompassLesson(row: LessonRow) {
  const mapped = mapCompassLessonFields(row);
  return {
    id: row.id,
    title: row.title,
    summary: mapped.summary,
    contentType: mapped.contentType as LessonContentType,
    content: mapped.contentBody,
    durationMin: null as number | null,
    order: row.order,
    isPublished: true,
  };
}

export async function loadCompassAdminSyllabusEditor(
  programId: string,
  organizationId: string,
) {
  const course = await getCompassCourseById(programId);
  if (!course || course.organizationId !== organizationId) return null;

  const base = await loadCompassSyllabus(programId);
  if (!base) {
    return {
      program: {
        id: course.id,
        name: course.title,
        slug: course.slug,
        category: course.category,
      },
      syllabus: null as null,
    };
  }

  const lessons = await prisma.$queryRaw<LessonRow[]>`
    SELECT id, "moduleId", title, content, "videoUrl", "order"
    FROM "Lesson"
    WHERE "courseId" = ${programId}
    ORDER BY "order" ASC
  `;
  const byModule = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const bucket = byModule.get(lesson.moduleId) ?? [];
    bucket.push(lesson);
    byModule.set(lesson.moduleId, bucket);
  }

  return {
    program: {
      id: course.id,
      name: course.title,
      slug: course.slug,
      category: course.category,
    },
    syllabus: {
      id: base.id,
      title: base.title,
      description: base.description,
      status: base.status as SyllabusStatus,
      modules: base.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        summary: mod.summary,
        order: mod.order,
        lessons: (byModule.get(mod.id) ?? []).map(mapCompassLesson),
      })),
    },
  };
}
