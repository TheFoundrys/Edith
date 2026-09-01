import Link from "next/link";
import { AdminRecentEnrollmentsTable } from "@/components/admin/admin-recent-tables";
import { PageHeader } from "@/components/ui/page";
import { requireStaff } from "@/lib/auth/session";
import { getAdminEnrollments } from "@/lib/admin/enrollments-data";

export default async function AdminEnrollmentsPage() {
  const session = await requireStaff();
  const rows = await getAdminEnrollments(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="All learner enrollments across programmes."
        actions={
          <Link href="/admin" className="text-sm text-fg-muted underline">
            Back to dashboard
          </Link>
        }
      />
      <AdminRecentEnrollmentsTable rows={rows} showViewAll={false} title="All enrollments" />
    </div>
  );
}
