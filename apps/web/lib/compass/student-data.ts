import "server-only";

import { loadCompassSyllabus } from "@/lib/compass/catalog";
import { getCompassCourseById } from "@/lib/compass/courses";
import { listCompassEnrollmentsForUser } from "@/lib/compass/enrollment";
import { listCompassTransactionsForUser } from "@/lib/compass/transactions";
import { loadCompassModules } from "@/lib/compass/syllabus";
import type { CompassProgramView } from "@/lib/compass/types";

type CompassSyllabusForStudent = {
  id: string;
  title: string | null;
  description: string | null;
  status: "PUBLISHED";
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
      contentType?: string;
      content?: string;
      durationMin: number | null;
      order: number;
      isPublished?: boolean;
    }[];
  }[];
};

export type MyCoursesEnrollmentRow = {
  id: string;
  status: string;
  enrolledAt: Date | null;
  program: CompassProgramView & {
    syllabus: CompassSyllabusForStudent | null;
    campus: null;
  };
  payments: { status: string }[];
};

export async function loadCompassMyCourses(
  userId: string,
): Promise<MyCoursesEnrollmentRow[]> {
  const enrollments = await listCompassEnrollmentsForUser(userId);
  const rows: MyCoursesEnrollmentRow[] = [];

  for (const enrollment of enrollments) {
    const program = await getCompassCourseById(enrollment.programId);
    if (!program) continue;

    const [syllabus, payments, modules] = await Promise.all([
      loadCompassSyllabus(enrollment.programId),
      listCompassTransactionsForUser(userId, enrollment.programId),
      loadCompassModules(enrollment.programId),
    ]);

    const syllabusWithModules = syllabus
      ? {
          ...syllabus,
          status: "PUBLISHED" as const,
          modules: modules.map((mod) => ({
            id: mod.id,
            title: mod.title,
            summary: mod.summary,
            order: mod.order,
            duration: mod.duration,
            lessons: mod.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              summary: lesson.summary,
              contentType: lesson.contentType,
              content: lesson.contentBody,
              durationMin: lesson.durationMin,
              order: lesson.order,
              isPublished: true,
            })),
          })),
        }
      : null;

    rows.push({
      id: enrollment.id,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      program: {
        ...program,
        campus: null,
        syllabus: syllabusWithModules,
      },
      payments: payments.map((p) => ({ status: p.status })),
    });
  }

  return rows;
}
