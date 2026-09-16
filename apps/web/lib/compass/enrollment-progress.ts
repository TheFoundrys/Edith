import "server-only";

import { prisma } from "@/lib/db";

function parseCompletedIds(progress: unknown): string[] {
  if (!progress || typeof progress !== "object") return [];
  const completed = (progress as { completedLessonIds?: unknown }).completedLessonIds;
  return Array.isArray(completed)
    ? completed.filter((id): id is string => typeof id === "string")
    : [];
}

/** Read completed lesson ids from Enrollment.progress JSON. */
export async function getCompassCompletedLessonIds(
  userId: string,
  courseIds?: string[],
): Promise<Set<string>> {
  const rows = courseIds?.length
    ? await prisma.$queryRaw<{ progress: unknown }[]>`
        SELECT progress FROM "Enrollment"
        WHERE "userId" = ${userId}
          AND "courseId" = ANY(${courseIds}::text[])
      `
    : await prisma.$queryRaw<{ progress: unknown }[]>`
        SELECT progress FROM "Enrollment"
        WHERE "userId" = ${userId} AND "courseId" IS NOT NULL
      `;

  const completed = new Set<string>();
  for (const row of rows) {
    for (const id of parseCompletedIds(row.progress)) {
      completed.add(id);
    }
  }
  return completed;
}
