import { DashboardHome } from "@/components/student/dashboard-home";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildDashboardStudyStats } from "@/lib/learning/dashboard-stats";
import { getCourseRecommendationsForUser } from "@/lib/learning/recommendations";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";
import { displayProgramName } from "@/lib/programs/categories";
import {
  PERSONALITY_PROFILE_HREF,
  isPersonalityProfileProgram,
  personalityProgress,
  type PersonalityResponses,
} from "@/lib/assessments/personality-profile";

function formatWhen(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

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

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const userId = session.user.id;
  const firstName = session.user.name.split(" ")[0] ?? session.user.name;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          slug: true,
          sku: true,
          domainSlug: true,
          category: true,
          duration: true,
          syllabus: {
            select: {
              status: true,
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, isPublished: true, durationMin: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ lastAccessedAt: "desc" }, { enrolledAt: "desc" }],
  });

  const programIds = enrollments.map((e) => e.program.id);
  const lessonIds = enrollments.flatMap((e) =>
    e.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(e.program.syllabus.modules).map((a) => a.id)
      : [],
  );

  const [completed, assignments, certificates, recentProgress, recommended, personalityAttempt] =
    await Promise.all([
      lessonIds.length
        ? prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: lessonIds },
              completedAt: { not: null },
            },
            select: {
              lessonId: true,
              completedAt: true,
              lesson: { select: { durationMin: true } },
            },
          })
        : Promise.resolve([]),
      programIds.length
        ? prisma.assignment.findMany({
            where: {
              isPublished: true,
              programId: { in: programIds },
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
          })
        : Promise.resolve([]),
      prisma.certificate.findMany({
        where: { userId },
        include: { program: { select: { title: true } } },
        orderBy: { issueDate: "desc" },
        take: 5,
      }),
      prisma.lessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  syllabus: { select: { program: { select: { title: true } } } },
                },
              },
            },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
      getCourseRecommendationsForUser(userId, {
        organizationId: session.user.organizationId,
        limit: 8,
      }),
      enrollments.some((e) => isPersonalityProfileProgram(e.program))
        ? prisma.cliftonAssessment.findFirst({
            where: {
              userId,
              organizationId: session.user.organizationId,
            },
            orderBy: { createdAt: "desc" },
            select: { responses: true },
          })
        : Promise.resolve(null),
    ]);

  const completedSet = new Set(completed.map((p) => p.lessonId));

  const personalityResponses = (personalityAttempt?.responses ??
    {}) as PersonalityResponses;

  const progressRows = enrollments
    .filter(
      (e) =>
        e.program.syllabus?.status === "PUBLISHED" ||
        isPersonalityProfileProgram(e.program),
    )
    .map((enrollment) => {
      if (isPersonalityProfileProgram(enrollment.program)) {
        const progress = personalityProgress(personalityResponses);
        return {
          id: enrollment.id,
          programId: enrollment.program.id,
          category: enrollment.program.category,
          title: displayProgramName(
            enrollment.program.title,
            enrollment.program.category,
          ),
          href:
            progress.pct === 100
              ? `${PERSONALITY_PROFILE_HREF}/report`
              : PERSONALITY_PROFILE_HREF,
          done: progress.done,
          total: progress.total,
          pct: progress.pct,
        };
      }
      const activities = flattenPublishedActivities(
        enrollment.program.syllabus!.modules,
      );
      const done = activities.filter((a) => completedSet.has(a.id)).length;
      const nextId = findContinueActivityId(activities, completedSet);
      return {
        id: enrollment.id,
        programId: enrollment.program.id,
        category: enrollment.program.category,
        title: displayProgramName(
          enrollment.program.title,
          enrollment.program.category,
        ),
        href: nextId
          ? `/student/learning/${enrollment.program.id}/lessons/${nextId}`
          : `/student/learning/${enrollment.program.id}`,
        done,
        total: activities.length,
        pct:
          activities.length === 0
            ? 0
            : Math.round((done / activities.length) * 100),
      };
    });

  const overallPct =
    progressRows.length === 0
      ? 0
      : Math.round(
          progressRows.reduce((sum, row) => sum + row.pct, 0) / progressRows.length,
        );

  const completedCourseCount = progressRows.filter((row) => row.pct === 100).length;

  const studyStats = buildDashboardStudyStats(
    completed.map((item) => ({
      completedAt: item.completedAt,
      durationMin: item.lesson.durationMin ?? 15,
    })),
  );

  const openAssignments = assignments
    .filter((assignment) => {
      const status = assignment.submissions[0]?.status;
      return status !== "SUBMITTED" && status !== "GRADED" && assignment.dueAt;
    })
    .slice(0, 4);

  const deadlines = openAssignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    subtitle: displayProgramName(
      assignment.program.title,
      assignment.program.category,
    ),
    dueLabel: formatDeadlineLabel(assignment.dueAt!),
    dateLabel: formatFullDate(assignment.dueAt!),
    href: `/student/assessments`,
  }));

  const achievements = [
    ...certificates.slice(0, 2).map((certificate) => ({
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
    ...recentProgress.slice(0, 2).map((item) => ({
      id: item.id,
      title: "Lesson completed",
      subtitle: `${item.lesson.title} · ${item.lesson.module.syllabus.program.title}`,
      whenLabel: item.completedAt ? relativeWhen(item.completedAt) : "",
      kind: "performance" as const,
    })),
  ].slice(0, 4);

  return (
    <DashboardHome
      firstName={firstName}
      progressRows={progressRows}
      overallPct={overallPct}
      completedCourseCount={completedCourseCount}
      certificateCount={certificates.length}
      studyHours={studyStats.studyHours}
      hoursThisWeek={studyStats.hoursThisWeek}
      weeklyGoalHours={studyStats.weeklyGoalHours}
      streakDays={studyStats.streakDays}
      activeDays={studyStats.activeDays}
      deadlines={deadlines}
      achievements={achievements}
      recommended={recommended}
    />
  );
}
