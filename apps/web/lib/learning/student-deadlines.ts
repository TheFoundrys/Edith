import { prisma } from "@/lib/db";
import { displayProgramName } from "@/lib/programs/categories";
import type { DashboardDeadline } from "@/components/student/dashboard-deadlines";

function formatFullDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDeadlineLabel(dueAt: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dueDay = new Date(dueAt);
  dueDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.round(
    (dueDay.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (daysUntil < 0) return "Overdue";
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "1 day left";
  return `${daysUntil} days left`;
}

export async function getStudentDeadlines(
  userId: string,
  limit?: number,
): Promise<DashboardDeadline[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    select: { programId: true },
  });
  const programIds = enrollments.map((e) => e.programId);
  if (programIds.length === 0) return [];

  const assignments = await prisma.assignment.findMany({
    where: {
      isPublished: true,
      programId: { in: programIds },
      dueAt: { not: null },
    },
    include: {
      program: { select: { title: true, category: true } },
      submissions: {
        where: { userId },
        select: { status: true },
        take: 1,
      },
    },
    orderBy: { dueAt: "asc" },
  });

  const open = assignments.filter((assignment) => {
    const status = assignment.submissions[0]?.status;
    return status !== "SUBMITTED" && status !== "GRADED";
  });

  const rows = open.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    subtitle: displayProgramName(
      assignment.program.title,
      assignment.program.category,
    ),
    dueLabel: formatDeadlineLabel(assignment.dueAt!),
    dateLabel: formatFullDate(assignment.dueAt!),
    href: `/student/assignments/${assignment.id}`,
  }));

  return limit ? rows.slice(0, limit) : rows;
}
