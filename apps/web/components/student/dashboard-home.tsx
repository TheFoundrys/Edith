import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { ProgramCategory } from "@prisma/client";
import { DashboardAchievements, type DashboardAchievement } from "@/components/student/dashboard-achievements";
import { DashboardContinueCard } from "@/components/student/dashboard-continue-card";
import { DashboardCourseTrack } from "@/components/student/dashboard-course-track";
import { DashboardDeadlines, type DashboardDeadline } from "@/components/student/dashboard-deadlines";
import { DashboardProgressWidget } from "@/components/student/dashboard-progress-widget";
import { DashboardProgramsCta } from "@/components/student/dashboard-programs-cta";
import { DashboardRecommendedCard } from "@/components/student/dashboard-recommended-card";
import { DashboardWeeklyGoal } from "@/components/student/dashboard-weekly-goal";
import type { CourseRecommendation } from "@/lib/learning/recommendations";
import { estimateRemainingLabel } from "@/lib/learning/dashboard-stats";

export type DashboardProgressRow = {
  id: string;
  title: string;
  href: string;
  programId: string;
  category?: ProgramCategory | null;
  done: number;
  total: number;
  pct: number;
};

export type DashboardRecommended = CourseRecommendation;

type DashboardHomeProps = {
  firstName: string;
  progressRows: DashboardProgressRow[];
  overallPct: number;
  completedCourseCount: number;
  certificateCount: number;
  studyHours: number;
  hoursThisWeek: number;
  weeklyGoalHours: number;
  streakDays: number;
  activeDays: boolean[];
  deadlines: DashboardDeadline[];
  achievements: DashboardAchievement[];
  recommended: DashboardRecommended[];
};

export function DashboardHome({
  firstName,
  progressRows,
  overallPct,
  completedCourseCount,
  certificateCount,
  studyHours,
  hoursThisWeek,
  weeklyGoalHours,
  streakDays,
  activeDays,
  deadlines,
  achievements,
  recommended,
}: DashboardHomeProps) {
  const continueCourses = progressRows.filter((row) => row.pct < 100);

  return (
    <div className="lms-dashboard dash-home">
      <header className="dash-home-header">
        <div>
          <h1 className="dash-home-title">Welcome back, {firstName}! 👋</h1>
          <p className="dash-home-lead">
            Keep your momentum — pick up where you left off or explore something new.
          </p>
        </div>
        <Link href="/student/settings" className="dash-customize-btn">
          <SlidersHorizontal className="size-4" strokeWidth={1.75} aria-hidden />
          Customize
        </Link>
      </header>

      <div className="dash-home-grid">
        <DashboardProgressWidget
          overallPct={overallPct}
          enrolledCount={progressRows.length}
          completedCount={completedCourseCount}
          certificateCount={certificateCount}
          studyHours={studyHours}
        />
        <DashboardWeeklyGoal
          hoursThisWeek={hoursThisWeek}
          weeklyGoalHours={weeklyGoalHours}
          streakDays={streakDays}
          activeDays={activeDays}
        />
      </div>

      <DashboardCourseTrack
        title="Continue Learning"
        actionHref="/student/my-courses"
      >
        {continueCourses.length === 0 ? (
          <div className="dash-track-empty">
            <p>No courses in progress yet.</p>
            <Link href="/student/enroll" className="dash-widget-link">
              Browse courses
            </Link>
          </div>
        ) : (
          continueCourses.map((row) => (
            <DashboardContinueCard
              key={row.id}
              title={row.title}
              href={`/student/my-courses/${row.programId}`}
              continueHref={row.href}
              category={row.category}
              pct={row.pct}
              remainingLabel={estimateRemainingLabel(row.done, row.total)}
            />
          ))
        )}
      </DashboardCourseTrack>

      <DashboardCourseTrack
        title="Recommended for You"
        actionHref="/student/recommendations"
      >
        {recommended.length === 0 ? (
          <div className="dash-track-empty">
            <p>You&apos;re enrolled in all available programmes.</p>
          </div>
        ) : (
          recommended.map((course) => (
            <DashboardRecommendedCard
              key={course.id}
              title={course.title}
              href={course.href}
              category={course.category}
              durationLabel={course.durationLabel}
              reason={course.reason}
            />
          ))
        )}
      </DashboardCourseTrack>

      <div className="dash-home-split">
        <DashboardDeadlines items={deadlines} />
        <DashboardAchievements items={achievements} />
      </div>

      <DashboardProgramsCta />
    </div>
  );
}
