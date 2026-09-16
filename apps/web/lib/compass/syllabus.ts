import "server-only";

import { isStoredLessonFile } from "@/lib/learning/lesson-file";
import { inferLessonContentType } from "@/lib/learning/video-embed";
import { prisma } from "@/lib/db";
import type { CompassLessonView, CompassModuleView } from "@/lib/compass/types";
import type { CourseLessonContext } from "@/lib/learning/course-context";
import { getCompassCourseById } from "@/lib/compass/courses";
import { loadCompassSyllabus } from "@/lib/compass/catalog";
import { filterVisibleModules } from "@/lib/learning/syllabus-visible";

type LessonRow = {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  slug: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  duration: string | null;
  order: number;
};

/** Map Compass Lesson columns to Edith SyllabusLesson fields (video in content, notes in summary). */
export function mapCompassLessonFields(row: {
  content: string | null;
  videoUrl: string | null;
}): {
  contentType: string;
  contentBody: string;
  summary: string | null;
} {
  const video = row.videoUrl?.trim() ?? "";
  const text = row.content?.trim() ?? "";
  if (video && isStoredLessonFile(video)) {
    return { contentType: "VIDEO_URL", contentBody: video, summary: text || null };
  }
  if (video) {
    return { contentType: "VIDEO_URL", contentBody: video, summary: text || null };
  }
  if (text && text.toLowerCase().endsWith(".pdf")) {
    return { contentType: "PDF_FILE", contentBody: text, summary: null };
  }
  if (text.startsWith("http://") || text.startsWith("https://")) {
    const inferred = inferLessonContentType(text);
    if (inferred === "VIDEO_URL") {
      return { contentType: "VIDEO_URL", contentBody: text, summary: null };
    }
    return { contentType: "EXTERNAL_LINK", contentBody: text, summary: null };
  }
  return { contentType: "RICH_TEXT", contentBody: text, summary: null };
}

function mapLessonRow(row: LessonRow): CompassLessonView {
  const mapped = mapCompassLessonFields(row);
  return {
    id: row.id,
    moduleId: row.moduleId,
    courseId: row.courseId,
    title: row.title,
    summary: mapped.summary,
    contentType: mapped.contentType,
    contentBody: mapped.contentBody,
    durationMin: null,
    order: row.order,
    isPublished: true,
  };
}

export async function loadCompassModules(
  courseId: string,
): Promise<CompassModuleView[]> {
  const modules = await prisma.$queryRaw<
    { id: string; title: string; goal: string | null; order: number; duration: string | null }[]
  >`
    SELECT id, title, goal, "order", duration
    FROM "Module"
    WHERE "courseId" = ${courseId}
    ORDER BY "order" ASC
  `;

  const lessons = await prisma.$queryRaw<LessonRow[]>`
    SELECT id, "moduleId", "courseId", title, slug, type, content, "videoUrl", duration, "order"
    FROM "Lesson"
    WHERE "courseId" = ${courseId}
    ORDER BY "order" ASC
  `;

  const byModule = new Map<string, CompassLessonView[]>();
  for (const row of lessons) {
    const bucket = byModule.get(row.moduleId) ?? [];
    bucket.push(mapLessonRow(row));
    byModule.set(row.moduleId, bucket);
  }

  return modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    summary: mod.goal,
    order: mod.order,
    duration: mod.duration,
    lessons: byModule.get(mod.id) ?? [],
  }));
}

export async function loadCompassLesson(
  courseId: string,
  lessonId: string,
): Promise<CompassLessonView | null> {
  const rows = await prisma.$queryRaw<LessonRow[]>`
    SELECT id, "moduleId", "courseId", title, slug, type, content, "videoUrl", duration, "order"
    FROM "Lesson"
    WHERE id = ${lessonId} AND "courseId" = ${courseId}
    LIMIT 1
  `;
  return rows[0] ? mapLessonRow(rows[0]) : null;
}

export async function loadCompassCourseLessonContext(opts: {
  programId: string;
  lessonId?: string | null;
  organizationId?: string;
}): Promise<CourseLessonContext | null> {
  const course = await getCompassCourseById(opts.programId);
  if (!course || course.status !== "PUBLISHED") return null;

  const modules = await loadCompassModules(opts.programId);
  const publishedModules = filterVisibleModules(modules);
  const syllabus = await loadCompassSyllabus(opts.programId);

  let lesson: CourseLessonContext["lesson"] = null;
  if (opts.lessonId) {
    for (const mod of publishedModules) {
      const found = mod.lessons.find((l) => l.id === opts.lessonId);
      if (found) {
        lesson = {
          id: found.id,
          title: found.title,
          summary: found.summary,
          contentType: found.contentType,
          contentBody: found.contentBody,
          durationMin: found.durationMin,
          moduleTitle: mod.title,
          moduleSummary: mod.summary,
        };
        break;
      }
    }
    if (!lesson) return null;
  }

  const outline = publishedModules
    .map((m) => {
      const header = m.summary ? `${m.title} — ${m.summary}` : m.title;
      const lines = m.lessons.map((l) => `  - ${l.title}`).join("\n");
      return `${header}\n${lines}`;
    })
    .join("\n\n");

  return {
    organizationId: course.organizationId,
    programId: course.id,
    programName: course.title,
    programSummary: course.description,
    eligibilitySummary: null,
    degreeLevel: course.degreeLevel,
    category: course.category,
    departmentName: null,
    campusName: null,
    syllabusTitle: syllabus?.title ?? course.title,
    syllabusDescription: syllabus?.description ?? course.description,
    syllabusOutline: outline,
    modules: publishedModules.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        summary: l.summary,
        durationMin: l.durationMin,
      })),
    })),
    lesson,
  };
}

/** Compass stores lesson completion inside Enrollment.progress JSON. */
export async function isCompassLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ progress: unknown }[]>`
    SELECT progress FROM "Enrollment"
    WHERE "userId" = ${userId} AND "courseId" = ${courseId}
    LIMIT 1
  `;
  const progress = rows[0]?.progress;
  if (!progress || typeof progress !== "object") return false;
  const completed = (progress as { completedLessonIds?: string[] }).completedLessonIds;
  return Array.isArray(completed) && completed.includes(lessonId);
}

export async function markCompassLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string,
) {
  const rows = await prisma.$queryRaw<{ id: string; progress: unknown }[]>`
    SELECT id, progress FROM "Enrollment"
    WHERE "userId" = ${userId} AND "courseId" = ${courseId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { error: "Enrollment not found." };

  const base =
    row.progress && typeof row.progress === "object"
      ? (row.progress as Record<string, unknown>)
      : {};
  const completed = new Set<string>(
    Array.isArray(base.completedLessonIds)
      ? (base.completedLessonIds as string[])
      : [],
  );
  completed.add(lessonId);
  const next = { ...base, completedLessonIds: [...completed] };

  await prisma.$executeRaw`
    UPDATE "Enrollment"
    SET progress = ${JSON.stringify(next)}::jsonb, "updatedAt" = NOW(), "lastAccessedAt" = NOW()
    WHERE id = ${row.id}
  `;
  return { ok: true as const };
}
