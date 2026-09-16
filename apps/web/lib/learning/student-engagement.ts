import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { displayProgramName } from "@/lib/programs/categories";
import { getUserCompletedLessonIds } from "@/lib/learning/progress";

export type EngagementItem = {
  id: string;
  kind: "assignment" | "quiz" | "lesson-mcq" | "course-mcq";
  title: string;
  subtitle: string;
  label: string;
  href: string;
  priority: number;
};

function daysUntil(dueAt: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueAt);
  dueDay.setHours(0, 0, 0, 0);
  return Math.round(
    (dueDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function dueLabel(dueAt: Date | null) {
  if (!dueAt) return "Open";
  const days = daysUntil(dueAt);
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days} days`;
  return `Due ${dueAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
}

function duePriority(dueAt: Date | null) {
  if (!dueAt) return 50;
  const days = daysUntil(dueAt);
  if (days < 0) return 100;
  if (days === 0) return 90;
  if (days <= 3) return 80;
  if (days <= 7) return 70;
  return 55;
}

export async function getStudentEngagementItems(
  userId: string,
  organizationId: string,
  limit = 8,
): Promise<EngagementItem[]> {
  if (isCompassDatabase()) return [];

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    select: { programId: true },
  });
  const programIds = enrollments.map((row) => row.programId);
  if (programIds.length === 0) return [];

  const completedLessons = await getUserCompletedLessonIds(userId, programIds);

  const [assignments, quizzes, lessonMcqs, courseMcqs, lessonAttempts, courseAttempts] =
    await Promise.all([
      prisma.assignment.findMany({
        where: { programId: { in: programIds }, isPublished: true },
        include: {
          program: { select: { title: true, category: true } },
          submissions: {
            where: { userId },
            select: { status: true },
            take: 1,
          },
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      }),
      prisma.quiz.findMany({
        where: { programId: { in: programIds }, status: "PUBLISHED" },
        include: {
          program: { select: { title: true, category: true } },
          attempts: { where: { userId }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.lessonMcq.findMany({
        where: {
          programId: { in: programIds },
          organizationId,
          isActive: true,
          status: "READY",
        },
        include: {
          program: { select: { title: true, category: true } },
          lesson: { select: { id: true, title: true } },
        },
      }),
      prisma.courseMcq.findMany({
        where: {
          programId: { in: programIds },
          organizationId,
          isActive: true,
          status: "READY",
        },
        include: { program: { select: { title: true, category: true } } },
      }),
      prisma.lessonMcqAttempt.findMany({
        where: { userId, lessonMcq: { programId: { in: programIds } } },
        select: { lessonMcqId: true, passed: true },
        orderBy: { submittedAt: "desc" },
      }),
      prisma.courseAssessmentAttempt.findMany({
        where: { userId, courseMcq: { programId: { in: programIds } } },
        select: { courseMcqId: true, passed: true, submittedAt: true },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

  const items: EngagementItem[] = [];

  for (const assignment of assignments) {
    const status = assignment.submissions[0]?.status;
    if (status === "SUBMITTED" || status === "GRADED") continue;
    items.push({
      id: assignment.id,
      kind: "assignment",
      title: assignment.title,
      subtitle: displayProgramName(
        assignment.program.title,
        assignment.program.category,
      ),
      label: dueLabel(assignment.dueAt),
      href: `/student/assignments/${assignment.id}`,
      priority: duePriority(assignment.dueAt),
    });
  }

  for (const quiz of quizzes) {
    if (quiz.attempts.length > 0) continue;
    items.push({
      id: quiz.id,
      kind: "quiz",
      title: quiz.title,
      subtitle: displayProgramName(quiz.program.title, quiz.program.category),
      label: "Not started",
      href: `/student/quizzes/${quiz.id}`,
      priority: 65,
    });
  }

  const latestLessonAttempt = new Map<string, boolean>();
  for (const attempt of lessonAttempts) {
    if (!latestLessonAttempt.has(attempt.lessonMcqId)) {
      latestLessonAttempt.set(attempt.lessonMcqId, attempt.passed);
    }
  }

  for (const mcq of lessonMcqs) {
    if (!completedLessons.has(mcq.lessonId)) continue;
    const passed = latestLessonAttempt.get(mcq.id);
    if (passed) continue;
    items.push({
      id: mcq.id,
      kind: "lesson-mcq",
      title: mcq.lesson.title,
      subtitle: displayProgramName(mcq.program.title, mcq.program.category),
      label: latestLessonAttempt.has(mcq.id) ? "Retake quiz" : "Lesson quiz",
      href: `/student/learning/${mcq.programId}/lessons/${mcq.lessonId}/mcq`,
      priority: latestLessonAttempt.has(mcq.id) ? 58 : 62,
    });
  }

  const courseMcqByProgram = new Map<string, (typeof courseMcqs)[number]>();
  for (const mcq of courseMcqs) {
    if (!courseMcqByProgram.has(mcq.programId)) {
      courseMcqByProgram.set(mcq.programId, mcq);
    }
  }

  for (const [programId, mcq] of courseMcqByProgram) {
    const attempts = courseAttempts.filter((row) =>
      courseMcqs.some(
        (bank) => bank.programId === programId && bank.id === row.courseMcqId,
      ),
    );
    const latest = attempts[0];
    const setCount = courseMcqs.filter((row) => row.programId === programId).length;
    items.push({
      id: programId,
      kind: "course-mcq",
      title: setCount > 1 ? "Course assessment" : mcq.title ?? "Course MCQ",
      subtitle: displayProgramName(mcq.program.title, mcq.program.category),
      label: latest ? (latest.passed ? "Practice again" : "Retake") : "New assessment",
      href:
        setCount > 1
          ? `/student/my-courses/${programId}/mcq`
          : `/student/my-courses/${programId}/mcq/${mcq.id}`,
      priority: latest ? 45 : 60,
    });
  }

  return items
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title))
    .slice(0, limit);
}
