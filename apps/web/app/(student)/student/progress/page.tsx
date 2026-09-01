import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  PERSONALITY_PROFILE_HREF,
  isPersonalityProfileProgram,
  personalityProgress,
  type PersonalityResponses,
} from "@/lib/assessments/personality-profile";
import { buildDashboardStudyStats } from "@/lib/learning/dashboard-stats";
import { flattenPublishedActivities } from "@/lib/learning/outline";
import { displayProgramName } from "@/lib/programs/categories";

export default async function StudentProgressPage() {
  const session = await requireStudent();

  const [enrollments, certificates, completions, personalityAttempt] =
    await Promise.all([
      prisma.enrollment.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        include: {
          program: {
            include: {
              syllabus: {
                include: {
                  modules: {
                    orderBy: { order: "asc" },
                    include: {
                      lessons: {
                        where: { isPublished: true },
                        orderBy: { order: "asc" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.certificate.count({ where: { userId: session.user.id } }),
      prisma.lessonProgress.findMany({
        where: { userId: session.user.id, completedAt: { not: null } },
        select: {
          lessonId: true,
          completedAt: true,
          lesson: { select: { durationMin: true } },
        },
      }),
      prisma.cliftonAssessment.findFirst({
        where: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
        },
        orderBy: { createdAt: "desc" },
        select: { responses: true },
      }),
    ]);

  const studyStats = buildDashboardStudyStats(
    completions.map((item) => ({
      completedAt: item.completedAt,
      durationMin: item.lesson.durationMin ?? 15,
    })),
  );

  const completedSet = new Set(completions.map((item) => item.lessonId));
  const personalityResponses = (personalityAttempt?.responses ??
    {}) as PersonalityResponses;

  const progressRows = enrollments
    .filter(
      (enrollment) =>
        enrollment.program.syllabus?.status === "PUBLISHED" ||
        isPersonalityProfileProgram(enrollment.program),
    )
    .map((enrollment) => {
      if (isPersonalityProfileProgram(enrollment.program)) {
        const progress = personalityProgress(personalityResponses);
        return {
          id: enrollment.id,
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
      const done = activities.filter((activity) => completedSet.has(activity.id)).length;
      const pct =
        activities.length === 0 ? 0 : Math.round((done / activities.length) * 100);

      return {
        id: enrollment.id,
        title: displayProgramName(
          enrollment.program.title,
          enrollment.program.category,
        ),
        href: `/student/learning/${enrollment.programId}`,
        done,
        total: activities.length,
        pct,
      };
    });

  const overallPct =
    progressRows.length === 0
      ? 0
      : Math.round(
          progressRows.reduce((sum, row) => sum + row.pct, 0) / progressRows.length,
        );
  const completedCourseCount = progressRows.filter((row) => row.pct === 100).length;

  return (
    <div>
      <PageHeader
        title="Learning progress"
        description="Overall stats and completion across your enrolled courses."
        actions={
          <Link href="/student/dashboard" className="text-sm text-fg-muted underline">
            Back to dashboard
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Overall progress
          </p>
          <p className="mt-2 text-2xl font-semibold">{overallPct}%</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Courses enrolled
          </p>
          <p className="mt-2 text-2xl font-semibold">{progressRows.length}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Courses completed
          </p>
          <p className="mt-2 text-2xl font-semibold">{completedCourseCount}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Certificates
          </p>
          <p className="mt-2 text-2xl font-semibold">{certificates}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Study hours
          </p>
          <p className="mt-2 text-2xl font-semibold">{studyStats.studyHours}</p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            This week
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {studyStats.hoursThisWeek}/{studyStats.weeklyGoalHours}h
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Streak
          </p>
          <p className="mt-2 text-2xl font-semibold">{studyStats.streakDays} days</p>
        </Panel>
      </div>

      {progressRows.length === 0 ? (
        <EmptyState
          title="No progress yet"
          description="Enroll in a course with a published outline to track progress."
          action={
            <Link href="/student/enroll" className="text-sm underline">
              Browse courses
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {progressRows.map((row) => (
            <Panel key={row.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={row.href} className="font-medium hover:underline">
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm text-fg-muted">
                    {row.done} / {row.total} activities
                  </p>
                </div>
                <Badge tone={row.pct === 100 ? "success" : "neutral"}>{row.pct}%</Badge>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg">
                <div className="h-full bg-accent" style={{ width: `${row.pct}%` }} />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
