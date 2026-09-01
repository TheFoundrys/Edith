import { DashboardHome } from "@/components/student/dashboard-home";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildDashboardStudyStats } from "@/lib/learning/dashboard-stats";
import { getCourseRecommendationsForUser } from "@/lib/learning/recommendations";
import { getStudentAchievements } from "@/lib/learning/student-achievements";
import { getStudentDeadlines } from "@/lib/learning/student-deadlines";
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

  const lessonIds = enrollments.flatMap((e) =>
    e.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(e.program.syllabus.modules).map((a) => a.id)
      : [],
  );

  const [completed, completionsForStats, certificateCount, recommended, personalityAttempt, achievements, deadlines] =
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
      prisma.lessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        select: {
          completedAt: true,
          lesson: { select: { durationMin: true } },
        },
      }),
      prisma.certificate.count({ where: { userId } }),
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
      getStudentAchievements(userId, 4),
      getStudentDeadlines(userId, 4),
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
    completionsForStats.map((item) => ({
      completedAt: item.completedAt,
      durationMin: item.lesson.durationMin ?? 15,
    })),
  );

  return (
    <DashboardHome
      firstName={firstName}
      progressRows={progressRows}
      overallPct={overallPct}
      completedCourseCount={completedCourseCount}
      certificateCount={certificateCount}
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
