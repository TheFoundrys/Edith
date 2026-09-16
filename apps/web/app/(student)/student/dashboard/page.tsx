import { DashboardHome } from "@/components/student/dashboard-home";
import { requireStudent } from "@/lib/auth/session";
import { findCompassCliftonAssessment } from "@/lib/compass/clifton-assessment";
import { countStudentCertificates } from "@/lib/certificates/queries";
import { loadStudentEnrollments } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getUserCompletedLessonIds } from "@/lib/learning/progress";
import { buildDashboardStudyStats } from "@/lib/learning/dashboard-stats";
import { getCourseRecommendationsForUser } from "@/lib/learning/recommendations";
import { getStudentAchievements } from "@/lib/learning/student-achievements";
import { getStudentDeadlines } from "@/lib/learning/student-deadlines";
import { getStudentEngagementItems } from "@/lib/learning/student-engagement";
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

  const compass = isCompassDatabase();
  const enrollmentRows = await loadStudentEnrollments(userId, ["ACTIVE"]);
  const enrollments = enrollmentRows.map((e) => ({
    id: e.id,
    program: {
      id: e.program.id,
      title: e.program.title,
      slug: e.program.slug,
      sku: null as string | null,
      domainSlug: null as string | null,
      category: e.program.category,
      duration: null as string | null,
      syllabus: e.program.syllabus,
    },
  }));

  const lessonIds = enrollments.flatMap((e) =>
    e.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(e.program.syllabus.modules).map((a) => a.id)
      : [],
  );
  const activeCourseIds = enrollments
    .filter((e) => e.program.syllabus?.status === "PUBLISHED")
    .map((e) => e.program.id);

  const [completedSetRaw, completionsForStats, certificateCount, recommended, personalityAttempt, achievements, deadlines, engagementItems] =
    await Promise.all([
      getUserCompletedLessonIds(userId, activeCourseIds),
      compass
        ? Promise.resolve([] as { completedAt: Date; lesson: { durationMin: number | null } }[])
        : prisma.lessonProgress.findMany({
            where: { userId, completedAt: { not: null } },
            select: {
              completedAt: true,
              lesson: { select: { durationMin: true } },
            },
          }),
      countStudentCertificates(userId),
      getCourseRecommendationsForUser(userId, {
        organizationId: session.user.organizationId,
        limit: 8,
      }),
      !compass &&
      enrollments.some((e) => isPersonalityProfileProgram(e.program))
        ? prisma.cliftonAssessment.findFirst({
            where: {
              userId,
              organizationId: session.user.organizationId,
            },
            orderBy: { createdAt: "desc" },
            select: { responses: true },
          })
        : compass &&
            enrollments.some((e) => isPersonalityProfileProgram(e.program))
          ? findCompassCliftonAssessment(userId).then((row) =>
              row ? { responses: row.responses } : null,
            )
          : Promise.resolve(null),
      getStudentAchievements(userId, 4),
      getStudentDeadlines(userId, 4),
      getStudentEngagementItems(userId, session.user.organizationId, 5),
    ]);

  const completedSet = completedSetRaw;
  const completed = [...completedSet].map((lessonId) => ({
    lessonId,
    completedAt: new Date(),
    lesson: { durationMin: null as number | null },
  }));

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
      engagementItems={engagementItems}
      achievements={achievements}
      recommended={recommended}
    />
  );
}
