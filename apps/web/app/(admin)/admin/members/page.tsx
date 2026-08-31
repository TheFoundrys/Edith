import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { MembersTable, type MemberRow } from "@/components/admin/members-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  resolvePageSize,
} from "@/components/ui/pagination";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { requireCapability } from "@/lib/auth/session";
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

  function hrefFor(overrides: Record<string, string | number | undefined> = {}) {
    const next = {
      q,
      roleId,
      sort,
      status,
      page,
      pageSize,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", String(next.q));
    if (next.roleId) params.set("roleId", String(next.roleId));
    if (next.sort !== "account") params.set("sort", String(next.sort));
    if (next.status !== "all") params.set("status", String(next.status));
    if (Number(next.pageSize) !== DEFAULT_PAGE_SIZE) {
      params.set("pageSize", String(next.pageSize));
    }
    if (Number(next.page) > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  return (
    <div>
      <MembersAdminHeader
        title="People"
        description="Invite staff, manage student memberships, suspend access, and set expiry."
        active="people"
        counts={counts}
        showRolesLink={isAdmin}
      />

      <form className="mb-[var(--grid-pad)] flex flex-wrap gap-2">
        {pageSize !== DEFAULT_PAGE_SIZE ? (
          <input type="hidden" name="pageSize" value={pageSize} />
        ) : null}
        <input type="hidden" name="sort" value={sort} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name or email"
          aria-label="Search members"
          className="h-9 min-w-[14rem] flex-1 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Filter by status"
          className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
        </select>
        {permissionRolesRaw.length > 0 ? (
          <select
            name="roleId"
            defaultValue={roleId}
            aria-label="Filter by role"
            className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
          >
            <option value="">All labels</option>
            {permissionRolesRaw.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        ) : null}
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-sm)] bg-accent px-3 text-sm text-accent-fg"
        >
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={q || roleId || status !== "all" ? "No matches" : "No members yet"}
          description={
            q || roleId || status !== "all"
              ? "Try a different search, status, or label filter."
              : "Invite staff or wait for students to register themselves."
          }
          action={
            q || roleId || status !== "all" ? (
              <Link href="/admin/members" className="text-sm underline underline-offset-2">
                Clear filters
              </Link>
            ) : null
          }
        />
      ) : (
        <MembersTable
          rows={rows}
          assignableRoles={permissionRolesRaw}
          rolesSetupHref={isAdmin ? "/admin/members/roles" : undefined}
          canInviteAdmins={isAdmin}
          footer={
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={memberTotal}
              hrefFor={(nextPage) => hrefFor({ page: nextPage })}
              pageSizeHrefFor={(nextSize) => hrefFor({ pageSize: nextSize, page: 1 })}
            />
          }
        />
      )}
    </div>
  );
}
