import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getUserCompletedLessonIds } from "@/lib/learning/progress";
import { buildDashboardStudyStats } from "@/lib/learning/dashboard-stats";
import type { DashboardAchievement } from "@/components/student/dashboard-achievements";

function formatWhen(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function relativeWhen(date: Date) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const days = Math.round(
    (startOfToday.getTime() - day.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  return formatWhen(date);
}

export async function getStudentAchievements(
  userId: string,
  limit?: number,
): Promise<DashboardAchievement[]> {
  if (isCompassDatabase()) {
    const completed = await getUserCompletedLessonIds(userId);
    if (completed.size === 0) return [];
    return [
      {
        id: "compass-lessons",
        title: "Lessons completed",
        subtitle: `${completed.size} lesson${completed.size === 1 ? "" : "s"} finished`,
        whenLabel: "Recently",
        kind: "performance" as const,
        href: "/student/progress",
      },
    ].slice(0, limit ?? 50);
  }

  const [certificates, userBadges, recentProgress, completions] = await Promise.all([
    prisma.certificate.findMany({
      where: { userId },
      include: { program: { select: { title: true } } },
      orderBy: { issueDate: "desc" },
      take: limit ?? 50,
    }),
    prisma.userBadge.findMany({
      where: { userId },
      include: { badge: { select: { name: true, description: true } } },
      orderBy: { earnedAt: "desc" },
      take: limit ?? 50,
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        lesson: {
          select: {
            title: true,
            durationMin: true,
            module: {
              select: {
                syllabus: { select: { program: { select: { title: true } } } },
              },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: limit ?? 50,
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completedAt: { not: null } },
      select: {
        completedAt: true,
        lesson: { select: { durationMin: true } },
      },
    }),
  ]);

  const studyStats = buildDashboardStudyStats(
    completions.map((item) => ({
      completedAt: item.completedAt,
      durationMin: item.lesson.durationMin ?? 15,
    })),
  );

  const items: DashboardAchievement[] = [
    ...userBadges.map((entry) => ({
      id: entry.id,
      title: "Badge earned",
      subtitle: entry.badge.description
        ? `${entry.badge.name} · ${entry.badge.description}`
        : entry.badge.name,
      whenLabel: relativeWhen(entry.earnedAt),
      kind: "badge" as const,
      href: "/student/badges",
    })),
    ...certificates.map((certificate) => ({
      id: certificate.id,
      title: "Certificate earned",
      subtitle: certificate.program.title,
      whenLabel: relativeWhen(certificate.issueDate),
      kind: "certificate" as const,
      href: `/student/certificates/${certificate.id}`,
    })),
    ...(studyStats.streakDays >= 3
      ? [
          {
            id: "streak",
            title: "Streak milestone",
            subtitle: `${studyStats.streakDays}-day learning streak`,
            whenLabel: "Active now",
            kind: "streak" as const,
          },
        ]
      : []),
    ...recentProgress.map((item) => ({
      id: item.id,
      title: "Lesson completed",
      subtitle: `${item.lesson.title} · ${item.lesson.module.syllabus.program.title}`,
      whenLabel: item.completedAt ? relativeWhen(item.completedAt) : "",
      kind: "performance" as const,
    })),
  ];

  return limit ? items.slice(0, limit) : items;
}
