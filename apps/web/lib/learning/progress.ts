import "server-only";

import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getCompassCompletedLessonIds } from "@/lib/compass/enrollment-progress";

/** Completed lesson ids for one or more courses. */
export async function getUserCompletedLessonIds(
  userId: string,
  courseIds?: string[],
): Promise<Set<string>> {
  if (isCompassDatabase()) {
    return getCompassCompletedLessonIds(userId, courseIds);
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId,
      completedAt: { not: null },
      ...(courseIds?.length
        ? {
            lesson: {
              module: {
                syllabus: { programId: { in: courseIds } },
              },
            },
          }
        : {}),
    },
    select: { lessonId: true },
  });
  return new Set(progress.map((p) => p.lessonId));
}

export async function isLessonCompleteForUser(
  userId: string,
  lessonId: string,
  courseId: string,
): Promise<boolean> {
  const completed = await getUserCompletedLessonIds(userId, [courseId]);
  return completed.has(lessonId);
}
