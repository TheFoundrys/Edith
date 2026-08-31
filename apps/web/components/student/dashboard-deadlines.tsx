import Link from "next/link";
import { CalendarClock } from "lucide-react";

export type DashboardDeadline = {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  dateLabel: string;
  href: string;
};

export function DashboardDeadlines({ items }: { items: DashboardDeadline[] }) {
  return (
    <section className="dash-widget dash-list-widget">
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">Upcoming Deadlines</h2>
        <Link href="/student/assessments" className="dash-widget-link">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="dash-empty">No deadlines approaching — you&apos;re on track.</p>
      ) : (
        <ul className="dash-deadline-list">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="dash-deadline-item">
                <span className="dash-deadline-icon" aria-hidden>
                  <CalendarClock className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="dash-deadline-title">{item.title}</span>
                  <span className="dash-deadline-subtitle">{item.subtitle}</span>
                </span>
                <span className="dash-deadline-when">
                  <span className="dash-deadline-badge">{item.dueLabel}</span>
                  <span className="dash-deadline-date">{item.dateLabel}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
