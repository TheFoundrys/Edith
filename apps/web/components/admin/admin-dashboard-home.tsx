import { CalendarDays, Download } from "lucide-react";
import { AdminDonutChart } from "@/components/admin/admin-donut-chart";
import { AdminEnrollmentChart } from "@/components/admin/admin-enrollment-chart";
import {
  AdminRecentCoursesTable,
  AdminRecentEnrollmentsTable,
} from "@/components/admin/admin-recent-tables";
import { AdminStatCards } from "@/components/admin/admin-stat-cards";
import {
  AdminInsightsBanner,
  AdminSystemOverview,
} from "@/components/admin/admin-system-overview";
import type { AdminDashboardData } from "@/lib/admin/dashboard-data";

export function AdminDashboardHome({ data }: { data: AdminDashboardData }) {
  const categoryTotal = data.categorySlices.reduce((sum, slice) => sum + slice.value, 0);
  const userTotal = data.roleSlices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="admin-dash">
      <header className="admin-dash-header">
        <div>
          <h1 className="admin-dash-title">Welcome back, {data.firstName}! 👋</h1>
          <p className="admin-dash-lead">Here&apos;s what&apos;s happening with Edith today.</p>
        </div>
        <div className="admin-dash-header-actions">
          <button type="button" className="admin-dash-date-btn">
            <CalendarDays className="size-4" strokeWidth={1.75} aria-hidden />
            {data.dateRangeLabel}
          </button>
          <button type="button" className="admin-dash-export-btn">
            <Download className="size-4" strokeWidth={1.75} aria-hidden />
            Export Report
          </button>
        </div>
      </header>

      <AdminStatCards stats={data.stats} />

      <div className="admin-dash-charts">
        <AdminEnrollmentChart points={data.enrollmentChart} />
        <AdminDonutChart
          title="Top Categories"
          subtitle="Published courses by subject track"
          centerValue={String(categoryTotal)}
          centerLabel="Courses"
          slices={data.categorySlices}
          href="/admin/programs"
        />
        <AdminDonutChart
          title="Users by Role"
          subtitle="Organization membership split"
          centerValue={userTotal.toLocaleString("en-IN")}
          centerLabel="Users"
          slices={data.roleSlices}
          href="/admin/members"
        />
      </div>

      <div className="admin-dash-bottom">
        <AdminRecentEnrollmentsTable rows={data.recentEnrollments} />
        <AdminRecentCoursesTable rows={data.recentCourses} />
        <AdminSystemOverview metrics={data.systemMetrics} />
      </div>

      <AdminInsightsBanner
        enrollmentChangePct={data.insights.enrollmentChangePct}
        revenueChangePct={data.insights.revenueChangePct}
        userChangePct={data.insights.userChangePct}
      />
    </div>
  );
}
