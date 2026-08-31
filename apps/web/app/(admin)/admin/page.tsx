import { AdminDashboardHome } from "@/components/admin/admin-dashboard-home";
import { getAdminDashboardData } from "@/lib/admin/dashboard-data";
import { requireStaff } from "@/lib/auth/session";

export default async function AdminOverviewPage() {
  const session = await requireStaff();
  const data = await getAdminDashboardData(
    session.user.organizationId,
    session.user.name,
  );

  return <AdminDashboardHome data={data} />;
}
