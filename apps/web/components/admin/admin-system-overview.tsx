import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { AdminSystemMetric } from "@/lib/admin/dashboard-data";
import { cn } from "@/lib/utils";

export function AdminSystemOverview({ metrics }: { metrics: AdminSystemMetric[] }) {
  return (
    <section className="admin-dash-panel">
      <div className="admin-dash-panel-head">
        <h2 className="admin-dash-panel-title">System Overview</h2>
      </div>

      <ul className="admin-dash-system-list">
        {metrics.map((metric) => {
          const inner = (
            <>
            <div className="admin-dash-system-copy">
              <span className="admin-dash-cell-primary">{metric.label}</span>
              <span className="admin-dash-system-value">
                {metric.value}
                {metric.detail ? (
                  <span className="admin-dash-cell-secondary"> {metric.detail}</span>
                ) : null}
              </span>
            </div>

            {metric.progress != null ? (
              <div className="admin-dash-system-progress">
                <div
                  className="admin-dash-system-progress-fill"
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
            ) : null}

            {metric.changePct != null ? (
              <span
                className={cn(
                  "admin-dash-system-change",
                  metric.changePct >= 0 ? "is-up" : "is-down",
                )}
              >
                {metric.changePct >= 0 ? (
                  <ArrowUpRight className="size-3.5" strokeWidth={1.75} aria-hidden />
                ) : (
                  <ArrowDownRight className="size-3.5" strokeWidth={1.75} aria-hidden />
                )}
                {Math.abs(metric.changePct)}%
              </span>
            ) : null}

            {metric.tone === "good" && metric.detail && metric.progress == null ? (
              <span className="admin-dash-system-tag is-good">{metric.detail}</span>
            ) : null}
            </>
          );

          return (
            <li key={metric.id}>
              {metric.href ? (
                <Link href={metric.href} className="admin-dash-system-item is-link">
                  {inner}
                </Link>
              ) : (
                <div className="admin-dash-system-item">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function AdminInsightsBanner({
  enrollmentChangePct,
  revenueChangePct,
  userChangePct,
}: {
  enrollmentChangePct: number;
  revenueChangePct: number;
  userChangePct: number;
}) {
  return (
    <section className="admin-dash-insights">
      <div>
        <p className="admin-dash-insights-title">Insights at a glance</p>
        <p className="admin-dash-insights-lead">Your platform is growing! 🚀</p>
      </div>

      <div className="admin-dash-insights-stats">
        <Link href="/admin/programs" className="admin-dash-insights-stat">
          <span className="admin-dash-insights-value">+{enrollmentChangePct}%</span>
          <span className="admin-dash-insights-label">Enrollments</span>
        </Link>
        <Link href="/admin/programs" className="admin-dash-insights-stat">
          <span className="admin-dash-insights-value">+{revenueChangePct}%</span>
          <span className="admin-dash-insights-label">Revenue</span>
        </Link>
        <Link href="/admin/members" className="admin-dash-insights-stat">
          <span className="admin-dash-insights-value">+{userChangePct}%</span>
          <span className="admin-dash-insights-label">New Users</span>
        </Link>
      </div>
    </section>
  );
}
