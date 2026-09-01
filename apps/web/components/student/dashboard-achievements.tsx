import Link from "next/link";
import { Award, Flame, Medal } from "lucide-react";

export type DashboardAchievement = {
  id: string;
  title: string;
  subtitle: string;
  whenLabel: string;
  kind: "certificate" | "streak" | "performance";
  href?: string;
};

const ICONS = {
  certificate: Award,
  streak: Flame,
  performance: Medal,
} as const;

export function DashboardAchievements({ items }: { items: DashboardAchievement[] }) {
  return (
    <section className="dash-widget dash-list-widget">
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">Recent Achievements</h2>
        <Link href="/student/achievements" className="dash-widget-link">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="dash-empty">Complete lessons and earn certificates to unlock achievements.</p>
      ) : (
        <ul className="dash-achievement-list">
          {items.map((item) => {
            const Icon = ICONS[item.kind];
            const content = (
              <>
                <span className={`dash-achievement-icon dash-achievement-icon-${item.kind}`}>
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="dash-achievement-title">{item.title}</span>
                  <span className="dash-achievement-subtitle">{item.subtitle}</span>
                </span>
                <span className="dash-achievement-when">{item.whenLabel}</span>
              </>
            );

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className="dash-achievement-item">
                    {content}
                  </Link>
                ) : (
                  <div className="dash-achievement-item">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
