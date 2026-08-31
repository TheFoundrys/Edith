import Link from "next/link";
import { Trophy } from "lucide-react";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

type DashboardWeeklyGoalProps = {
  hoursThisWeek: number;
  weeklyGoalHours: number;
  streakDays: number;
  activeDays: boolean[];
};

export function DashboardWeeklyGoal({
  hoursThisWeek,
  weeklyGoalHours,
  streakDays,
  activeDays,
}: DashboardWeeklyGoalProps) {
  const goalMet = hoursThisWeek >= weeklyGoalHours;
  const progressPct = Math.min(
    100,
    Math.round((hoursThisWeek / weeklyGoalHours) * 100),
  );

  return (
    <section className="dash-widget dash-weekly-widget">
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">Weekly Goal</h2>
        <Link href="/student/progress" className="dash-widget-link">
          Edit goal
        </Link>
      </div>

      <div className="dash-weekly-summary">
        <div>
          <p className="dash-weekly-hours">
            {hoursThisWeek}/{weeklyGoalHours} hours this week
          </p>
          <p className="dash-weekly-status">
            {goalMet
              ? "Goal achieved — great consistency!"
              : `${weeklyGoalHours - hoursThisWeek} hour${weeklyGoalHours - hoursThisWeek === 1 ? "" : "s"} to reach your goal`}
          </p>
        </div>
        <span className="dash-weekly-trophy" aria-hidden>
          <Trophy className="size-5" strokeWidth={1.75} />
        </span>
      </div>

      <div
        className="dash-weekly-track"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Weekly study goal progress"
      >
        <div className="dash-weekly-track-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="dash-weekly-streak">
        <p className="dash-weekly-streak-label">
          {streakDays > 0 ? `${streakDays}-day streak` : "Start your streak today"}
        </p>
        <div className="dash-weekly-days" aria-label="Activity this week">
          {DAY_LABELS.map((label, index) => (
            <span
              key={`${label}-${index}`}
              className={
                activeDays[index]
                  ? "dash-weekly-day dash-weekly-day-active"
                  : "dash-weekly-day"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
