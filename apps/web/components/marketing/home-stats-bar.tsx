import { Award, BookOpen, Smile, Users } from "lucide-react";
import type { HomePageData } from "@/lib/marketing/home-data";

const STATS = [
  {
    key: "learners",
    icon: Users,
    label: "Learners",
    value: (stats: HomePageData["stats"]) => stats.learnersLabel,
  },
  {
    key: "instructors",
    icon: Award,
    label: "Instructors",
    value: (stats: HomePageData["stats"]) => stats.instructorsLabel,
  },
  {
    key: "courses",
    icon: BookOpen,
    label: "Courses",
    value: (stats: HomePageData["stats"]) => stats.coursesLabel,
  },
  {
    key: "satisfaction",
    icon: Smile,
    label: "Completion rate",
    value: (stats: HomePageData["stats"]) =>
      stats.satisfactionRate != null ? `${stats.satisfactionRate}%` : "—",
  },
] as const;

export function HomeStatsBar({ stats }: { stats: HomePageData["stats"] }) {
  return (
    <section className="home-stats-bar" aria-label="Platform statistics">
      <div className="home-container home-stats-bar-inner">
        {STATS.map(({ key, icon: Icon, label, value }) => (
          <div key={key} className="home-stat">
            <span className="home-stat-icon" aria-hidden>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="home-stat-value">{value(stats)}</p>
              <p className="home-stat-label">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
