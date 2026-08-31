import { CapabilityMatrix } from "@/components/admin/capability-matrix";
import { RolesPanel, type PermissionRoleRow } from "@/components/admin/roles-panel";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader } from "@/components/ui/page";
import { Tabs } from "@/components/ui/tabs";
import { loadOrgCapabilityMatrix } from "@/lib/auth/org-capabilities";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const VIEWS = [
  { value: "roles", label: "Assignable roles" },
  { value: "permissions", label: "Staff permissions" },
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

  const [permissionRolesRaw, capabilityMatrix] = await Promise.all([
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
  ]);

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
        title="Roles & access"
        description="Manage member labels and staff permissions."
      />

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
