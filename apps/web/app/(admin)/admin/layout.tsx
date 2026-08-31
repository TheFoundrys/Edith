import { AppShell } from "@/components/layout/app-shell";
import { adminNavGroupsFor } from "@/lib/admin/nav";
import { loadOrgCapabilityMatrix } from "@/lib/auth/org-capabilities";
import { roleLabel } from "@/lib/auth/roles";
import { requireStaff } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();
  const matrix = await loadOrgCapabilityMatrix(session.user.organizationId);
  const caps = matrix[session.user.role] ?? [];
  const navGroups = adminNavGroupsFor(
    (cap) => caps.includes(cap),
    session.user.role === "SUPER_ADMIN",
  );

  return (
    <AppShell
      brand={APP_NAME}
      navGroups={navGroups}
      variant="admin"
      userRoleLabel={roleLabel(session.user.role)}
      workspaceHref="/admin"
      workspaceLabel="Workspace"
    >
      {children}
    </AppShell>
  );
}
