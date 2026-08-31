import Link from "next/link";
import type { AdminChartPoint } from "@/lib/admin/dashboard-data";

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  max: number,
  padding = 16,
) {
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const step = innerW / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = padding + innerH - (value / max) * innerH;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function AdminEnrollmentChart({ points }: { points: AdminChartPoint[] }) {
  const width = 560;
  const height = 220;
  const max = Math.max(...points.flatMap((point) => [point.thisWeek, point.lastWeek]), 1);
  const thisWeekPath = buildLinePath(
    points.map((point) => point.thisWeek),
    width,
    height,
    max,
  );
  const lastWeekPath = buildLinePath(
    points.map((point) => point.lastWeek),
    width,
    height,
    max,
  );

  return (
    <section className="admin-dash-panel admin-dash-chart-panel">
      <div className="admin-dash-panel-head">
        <div>
          <h2 className="admin-dash-panel-title">Enrollments Overview</h2>
          <p className="admin-dash-panel-lead">Daily enrollments this week vs last week</p>
        </div>
        <div className="admin-dash-chart-legend">
          <span>
            <i className="admin-dash-legend-line is-solid" aria-hidden /> This Week
          </span>
          <span>
            <i className="admin-dash-legend-line is-dashed" aria-hidden /> Last Week
          </span>
          <Link href="/admin/programs" className="admin-dash-panel-link">
            View courses
          </Link>
        </div>
      </div>

      <div className="admin-dash-line-chart-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="admin-dash-line-chart"
          role="img"
          aria-label="Enrollment trend chart"
        >
          {[0, 1, 2, 3].map((line) => {
            const y = 16 + ((height - 32) / 3) * line;
            return (
              <line
                key={line}
                x1="16"
                x2={width - 16}
                y1={y}
                y2={y}
                className="admin-dash-grid-line"
              />
            );
          })}
          <path d={lastWeekPath} className="admin-dash-line admin-dash-line-muted" />
          <path d={thisWeekPath} className="admin-dash-line admin-dash-line-primary" />
          {points.map((point, index) => {
            const x = 16 + index * ((width - 32) / Math.max(points.length - 1, 1));
            const y = 16 + (height - 32) - (point.thisWeek / max) * (height - 32);
            return <circle key={point.label} cx={x} cy={y} r="4" className="admin-dash-line-dot" />;
          })}
        </svg>
        <div className="admin-dash-line-labels">
          {points.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
