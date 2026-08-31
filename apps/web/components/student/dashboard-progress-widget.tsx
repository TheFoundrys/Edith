import Link from "next/link";

type DashboardProgressWidgetProps = {
  overallPct: number;
  enrolledCount: number;
  completedCount: number;
  certificateCount: number;
  studyHours: number;
};

export function DashboardProgressWidget({
  overallPct,
  enrolledCount,
  completedCount,
  certificateCount,
  studyHours,
}: DashboardProgressWidgetProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallPct / 100) * circumference;

  return (
    <section className="dash-widget dash-progress-widget">
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">Your Learning Progress</h2>
        <Link href="/student/progress" className="dash-widget-link">
          View all
        </Link>
      </div>

      <div className="dash-progress-body">
        <div className="dash-progress-ring-wrap" aria-hidden>
          <svg className="dash-progress-ring" viewBox="0 0 128 128">
            <circle
              className="dash-progress-ring-track"
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
            />
            <circle
              className="dash-progress-ring-fill"
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
            />
          </svg>
          <div className="dash-progress-ring-label">
            <span className="dash-progress-ring-value">{overallPct}%</span>
            <span className="dash-progress-ring-caption">Overall Progress</span>
          </div>
        </div>

        <ul className="dash-progress-stats">
          <li>
            <span className="dash-progress-stat-value">{enrolledCount}</span>
            <span className="dash-progress-stat-label">Courses Enrolled</span>
          </li>
          <li>
            <span className="dash-progress-stat-value">{completedCount}</span>
            <span className="dash-progress-stat-label">Courses Completed</span>
          </li>
          <li>
            <span className="dash-progress-stat-value">{certificateCount}</span>
            <span className="dash-progress-stat-label">Certificates Earned</span>
          </li>
          <li>
            <span className="dash-progress-stat-value">{studyHours}</span>
            <span className="dash-progress-stat-label">Study Hours</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
