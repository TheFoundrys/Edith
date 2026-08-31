import Link from "next/link";
import {
  Award,
  BookOpen,
  DollarSign,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { AdminStatCard } from "@/lib/admin/dashboard-data";
import { cn } from "@/lib/utils";

const ICONS = {
  users: Users,
  courses: BookOpen,
  enrollments: GraduationCap,
  revenue: DollarSign,
  certificates: Award,
} as const;

function StatCardBody({ stat }: { stat: AdminStatCard }) {
  const Icon = ICONS[stat.id as keyof typeof ICONS] ?? Users;
  const positive = stat.changePct >= 0;
  return (
    <>
      <div className={cn("admin-dash-stat-icon", `admin-dash-stat-icon-${stat.tone}`)}>
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="admin-dash-stat-copy">
        <p className="admin-dash-stat-label">{stat.label}</p>
        <p className="admin-dash-stat-value">{stat.value}</p>
        <p className={cn("admin-dash-stat-change", positive ? "is-up" : "is-down")}>
          {positive ? (
            <TrendingUp className="size-3.5" strokeWidth={1.75} aria-hidden />
          ) : (
            <TrendingDown className="size-3.5" strokeWidth={1.75} aria-hidden />
          )}
          {Math.abs(stat.changePct)}% vs last 7 days
        </p>
      </div>
    </>
  );
}

export function AdminStatCards({ stats }: { stats: AdminStatCard[] }) {
  return (
    <div className="admin-dash-stats">
      {stats.map((stat) =>
        stat.href ? (
          <Link
            key={stat.id}
            href={stat.href}
            className="admin-dash-stat-card is-link"
            aria-label={`${stat.label}: ${stat.value}`}
          >
            <StatCardBody stat={stat} />
          </Link>
        ) : (
          <article key={stat.id} className="admin-dash-stat-card">
            <StatCardBody stat={stat} />
          </article>
        ),
      )}
    </div>
  );
}
