import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { MembersTable, type MemberRow } from "@/components/admin/members-table";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { DEFAULT_PAGE_SIZE, resolvePageSize } from "@/lib/pagination";
import { requireCapability } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";
import { membershipAccessState } from "@/lib/members/status";
import type { Prisma } from "@prisma/client";
import Link from "next/link";

const SORTS = {
  account: { orderBy: { user: { name: "asc" as const } } },
  recent: { orderBy: { createdAt: "desc" as const } },
  expiry: { orderBy: { expiresAt: "asc" as const } },
};

type SortKey = keyof typeof SORTS;
type StatusFilter = "all" | "active" | "suspended" | "expired";

function isSort(value: string | undefined): value is SortKey {
  return !!value && Object.hasOwn(SORTS, value);
}

function isStatus(value: string | undefined): value is StatusFilter {
  return value === "all" || value === "active" || value === "suspended" || value === "expired";
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    roleId?: string;
    sort?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const session = await requireCapability("manageMembers");
  redirectIfCompassAdminRoute();
  const sp = await searchParams;
  const orgId = session.user.organizationId;
  const isAdmin = session.user.role === "SUPER_ADMIN";
  const sort: SortKey = isSort(sp.sort) ? sp.sort : "account";
  const status: StatusFilter = isStatus(sp.status) ? sp.status : "all";
  const q = sp.q?.trim() ?? "";
  const roleId = sp.roleId?.trim() ?? "";
  const pageSize = resolvePageSize(sp.pageSize);
  const requestedPage = Math.max(1, Math.trunc(Number(sp.page)) || 1);

  const [counts, permissionRolesRaw] = await Promise.all([
    memberWorkspaceCounts(orgId),
    prisma.permissionRole.findMany({
      where: { organizationId: orgId, isSystem: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const membershipWhere: Prisma.MembershipWhereInput = {
    organizationId: orgId,
    ...(roleId ? { roles: { some: { permissionRoleId: roleId } } } : {}),
    ...(status === "suspended" ? { status: "SUSPENDED" } : {}),
    ...(status === "active"
      ? {
          status: "ACTIVE",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        }
      : {}),
    ...(status === "expired"
      ? { status: "ACTIVE", expiresAt: { lte: new Date() } }
      : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const memberTotal = await prisma.membership.count({ where: membershipWhere });
  const totalPages = Math.max(1, Math.ceil(memberTotal / pageSize));
  const page = Math.min(requestedPage, totalPages);

  const memberships = await prisma.membership.findMany({
    where: membershipWhere,
    orderBy: SORTS[sort].orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      role: true,
      status: true,
      expiresAt: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
          _count: { select: { enrollments: true } },
        },
      },
      roles: { select: { permissionRoleId: true } },
    },
  });

  const rows: MemberRow[] = memberships.map((membership) => ({
    kind: "member",
    id: membership.id,
    name: membership.user.name,
    email: membership.user.email,
    programs: membership.user._count.enrollments,
    expiresAt: membership.expiresAt ? membership.expiresAt.toISOString() : null,
    roleIds: membership.roles.map((role) => role.permissionRoleId),
    enumRole: membership.role,
    status: membership.status,
    accessState: membershipAccessState(membership),
    isSelf: membership.userId === session.user.id,
  }));

  const query: Record<string, string> = {};
  if (q) query.q = q;
  if (roleId) query.roleId = roleId;
  if (sort !== "account") query.sort = sort;
  if (status !== "all") query.status = status;

  return (
    <div>
      <MembersAdminHeader
        description="Invite staff, manage student memberships, suspend access, and set expiry."
        active="people"
        counts={counts}
        showRolesLink={isAdmin}
      />

      <Panel className="mb-[var(--grid-pad)] p-3">
        <form className="flex flex-wrap gap-2">
          {pageSize !== DEFAULT_PAGE_SIZE ? (
            <input type="hidden" name="pageSize" value={pageSize} />
          ) : null}
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name or email"
            aria-label="Search members"
            className="min-w-[14rem] flex-1 h-9"
          />
          <Select name="status" defaultValue={status} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="expired">Expired</option>
          </Select>
          <Select name="sort" defaultValue={sort} aria-label="Sort members">
            <option value="account">Name</option>
            <option value="recent">Recently added</option>
            <option value="expiry">Expiry</option>
          </Select>
          {permissionRolesRaw.length > 0 ? (
            <Select name="roleId" defaultValue={roleId} aria-label="Filter by role">
              <option value="">All labels</option>
              {permissionRolesRaw.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </Panel>

      <MembersTable
        rows={rows}
        assignableRoles={permissionRolesRaw}
        rolesSetupHref={isAdmin ? "/admin/members/roles" : undefined}
        canInviteAdmins={isAdmin}
        emptyTitle={q || roleId || status !== "all" ? "No matches" : "No members yet"}
        emptyDescription={
          q || roleId || status !== "all"
            ? "Try a different search, status, or label filter."
            : "Invite staff, or wait for students to register themselves."
        }
        emptyAction={
          q || roleId || status !== "all" ? (
            <Link href="/admin/members">
              <Button size="sm" variant="secondary">
                Clear filters
              </Button>
            </Link>
          ) : undefined
        }
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={memberTotal}
            unit="people"
            pathname="/admin/members"
            query={query}
          />
        }
      />
    </div>
  );
}
