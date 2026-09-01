import Link from "next/link";
import { AdminEnrollmentChart } from "@/components/admin/admin-enrollment-chart";
import { PageHeader } from "@/components/ui/page";
import { getAdminDashboardData } from "@/lib/admin/dashboard-data";
import { requireStaff } from "@/lib/auth/session";

export default async function AdminEnrollmentAnalyticsPage() {
  const session = await requireStaff();
  const data = await getAdminDashboardData(
    session.user.organizationId,
    session.user.name,
  );

  return (
    <div>
      <PageHeader
        title="Enrollment trends"
        description="Daily enrollments this week compared to last week."
        actions={
          <Link href="/admin/enrollments" className="text-sm text-fg-muted underline">
            All enrollments
          </Link>
        }
      />
      <AdminEnrollmentChart points={data.enrollmentChart} showViewAll={false} />
    </div>
  );
}
