import { CapabilityMatrix } from "@/components/admin/capability-matrix";
import { RolesPanel, type PermissionRoleRow } from "@/components/admin/roles-panel";
import { StaffRoleCards } from "@/components/admin/staff-role-cards";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page";
import { Tabs } from "@/components/ui/tabs";
import { loadOrgCapabilityMatrix } from "@/lib/auth/org-capabilities";
import { isAppRole, type AppRole } from "@/lib/auth/roles";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const VIEWS = [
  { value: "roles", label: "Assignable roles" },
  { value: "permissions", label: "Staff permissions matrix" },
] as const;

type ViewValue = (typeof VIEWS)[number]["value"];

function isView(value: string | undefined): value is ViewValue {
  return !!value && VIEWS.some((v) => v.value === value);
}

export default async function AdminMembersRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await requireSuperAdmin();
  const sp = await searchParams;
  const orgId = session.user.organizationId;
  const view: ViewValue = isView(sp.view) ? sp.view : "roles";

  const [permissionRolesRaw, capabilityMatrix, membershipCounts] =
    await Promise.all([
      prisma.permissionRole.findMany({
        where: { organizationId: orgId, isSystem: false },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isSystem: true,
          _count: { select: { memberships: true } },
        },
      }),
      view === "permissions" ? loadOrgCapabilityMatrix(orgId) : null,
      prisma.membership.groupBy({
        by: ["role"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
    ]);

  const roleCounts: Partial<Record<AppRole, number>> = {};
  for (const row of membershipCounts) {
    if (isAppRole(row.role)) roleCounts[row.role] = row._count._all;
  }

  const roleRows: PermissionRoleRow[] = permissionRolesRaw.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    isSystem: r.isSystem,
    memberCount: r._count.memberships,
  }));

  function hrefFor(nextView: string) {
    return nextView === "roles"
      ? "/admin/members/roles"
      : `/admin/members/roles?view=${nextView}`;
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/admin/members", label: "Members" },
          { label: "Roles & access" },
        ]}
      />
      <PageHeader
        title="User roles & permissions"
        description="Institute staff access: Super Administrator, Academic Dean, Bursar, Admissions Staff, and Lead Faculty."
      />

      <StaffRoleCards counts={roleCounts} />

      <div className="mb-[var(--grid-pad)]">
        <Tabs
          items={[...VIEWS]}
          active={view}
          hrefFor={hrefFor}
          label="Roles views"
        />
      </div>

      {view === "permissions" && capabilityMatrix ? (
        <CapabilityMatrix matrix={capabilityMatrix} />
      ) : (
        <RolesPanel roles={roleRows} />
      )}
    </div>
  );
}
