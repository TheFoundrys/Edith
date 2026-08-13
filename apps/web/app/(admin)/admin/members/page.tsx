import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import {
  DEFAULT_PAGE_SIZE,
  Pagination,
  resolvePageSize,
} from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { MembersTable, type MemberRow, type GroupRow } from "@/components/admin/members-table";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const TABS = [
  { value: "all", label: "All" },
  { value: "members", label: "Members" },
  { value: "groups", label: "Groups" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

const SORTS = {
  account: { label: "Sort by account", orderBy: { user: { name: "asc" } } },
  recent: { label: "Newest first", orderBy: { createdAt: "desc" } },
  expiry: { label: "Expiring soonest", orderBy: { expiresAt: "asc" } },
} satisfies Record<
  string,
  { label: string; orderBy: Prisma.MembershipOrderByWithRelationInput }
>;

type SortKey = keyof typeof SORTS;

function isTab(value: string | undefined): value is TabValue {
  return !!value && TABS.some((t) => t.value === value);
}

function isSort(value: string | undefined): value is SortKey {
  return !!value && Object.hasOwn(SORTS, value);
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    roleId?: string;
    sort?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const session = await requireCapability("manageMembers");
  const sp = await searchParams;
  const orgId = session.user.organizationId;

  const tab: TabValue = isTab(sp.tab) ? sp.tab : "all";
  const sort: SortKey = isSort(sp.sort) ? sp.sort : "account";
  const q = sp.q?.trim() ?? "";
  const roleId = sp.roleId?.trim() ?? "";
  const pageSize = resolvePageSize(sp.pageSize);
  const requestedPage = Math.max(1, Math.trunc(Number(sp.page)) || 1);

  const membershipWhere: Prisma.MembershipWhereInput = {
    organizationId: orgId,
    ...(roleId ? { roles: { some: { permissionRoleId: roleId } } } : {}),
    ...(q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Groups have no role assignments, so a role filter excludes them entirely.
  const groupWhere: Prisma.GroupWhereInput = {
    organizationId: orgId,
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const showMembers = tab === "all" || tab === "members";
  const showGroups = (tab === "all" || tab === "groups") && !roleId;

  const [memberTotal, groupTotal, permissionRoles, memberTabCount, groupTabCount] =
    await Promise.all([
      showMembers ? prisma.membership.count({ where: membershipWhere }) : 0,
      showGroups ? prisma.group.count({ where: groupWhere }) : 0,
      prisma.permissionRole.findMany({
        where: { organizationId: orgId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.membership.count({ where: { organizationId: orgId } }),
      prisma.group.count({ where: { organizationId: orgId } }),
    ]);

  // Groups occupy the first rows of the combined list, then memberships follow,
  // so one page window can straddle both without loading everything.
  const total = memberTotal + groupTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp rather than show an empty page when the URL points past the last one,
  // which happens after rows are removed or the page size grows.
  const page = Math.min(requestedPage, totalPages);
  const start = (page - 1) * pageSize;
  const groupSkip = Math.min(start, groupTotal);
  const groupTake = Math.max(0, Math.min(pageSize, groupTotal - groupSkip));
  const memberSkip = Math.max(0, start - groupTotal);
  const memberTake = pageSize - groupTake;

  const [groups, memberships] = await Promise.all([
    showGroups && groupTake > 0
      ? prisma.group.findMany({
          where: groupWhere,
          orderBy: { name: "asc" },
          skip: groupSkip,
          take: groupTake,
          select: {
            id: true,
            name: true,
            description: true,
            isArchived: true,
            _count: { select: { members: true } },
          },
        })
      : [],
    showMembers && memberTake > 0
      ? prisma.membership.findMany({
          where: membershipWhere,
          orderBy: SORTS[sort].orderBy,
          skip: memberSkip,
          take: memberTake,
          select: {
            id: true,
            role: true,
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
        })
      : [],
  ]);

  const groupRows: GroupRow[] = groups.map((group) => ({
    kind: "group",
    id: group.id,
    name: group.name,
    subtitle: group.description ?? `${group._count.members} member${group._count.members === 1 ? "" : "s"}`,
    programs: group._count.members,
    isArchived: group.isArchived,
  }));

  const memberRows: MemberRow[] = memberships.map((m) => ({
    kind: "member",
    id: m.id,
    name: m.user.name,
    email: m.user.email,
    programs: m.user._count.enrollments,
    expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
    roleIds: m.roles.map((r) => r.permissionRoleId),
    enumRole: m.role,
    isSelf: m.userId === session.user.id,
  }));

  function buildHref(
    overrides: Partial<{
      tab: string;
      q: string;
      roleId: string;
      sort: string;
      page: number;
      pageSize: number;
    }> = {},
  ) {
    const next = {
      tab,
      q,
      roleId,
      sort,
      page,
      pageSize,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (next.tab !== "all") params.set("tab", next.tab);
    if (next.q) params.set("q", next.q);
    if (next.roleId) params.set("roleId", next.roleId);
    if (next.sort !== "account") params.set("sort", next.sort);
    if (next.pageSize !== DEFAULT_PAGE_SIZE) {
      params.set("pageSize", String(next.pageSize));
    }
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  const rows = [...groupRows, ...memberRows];
  const filtered = Boolean(q || roleId);

  const emptyState = filtered
    ? {
        title: "No matches",
        description: "Try a different search term or clear the role filter.",
      }
    : tab === "groups"
      ? {
          title: "No groups yet",
          description: "Groups created for this organization will be listed here.",
        }
      : {
          title: "No members yet",
          description:
            "Add an existing account to this organization to get started.",
        };

  return (
    <div className="peak-rise">
      <PageHeader
        title={`Members (${memberTabCount})`}
        description="Assign roles, set when access ends, and remove people from this organization."
      />

      <div className="mb-[var(--grid-pad)]">
        <Tabs
          items={[
            { value: "all", label: "All", count: memberTabCount + groupTabCount },
            { value: "members", label: "Members", count: memberTabCount },
            { value: "groups", label: "Groups", count: groupTabCount },
          ]}
          active={tab}
          // Filters persist across tabs, but the page resets to the first.
          hrefFor={(value) => buildHref({ tab: value, page: 1 })}
          label="Member views"
        />
      </div>

      <form className="mb-[var(--grid-pad)] flex flex-wrap gap-3">
        {tab !== "all" ? <input type="hidden" name="tab" value={tab} /> : null}
        {pageSize !== DEFAULT_PAGE_SIZE ? (
          <input type="hidden" name="pageSize" value={pageSize} />
        ) : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name or email"
          aria-label="Search members"
          className="h-9 min-w-[14rem] flex-1 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        />
        <select
          name="roleId"
          defaultValue={roleId}
          aria-label="Filter by role"
          className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        >
          <option value="">All roles</option>
          {permissionRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          aria-label="Sort members"
          className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        >
          {Object.entries(SORTS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-sm)] bg-accent px-3 text-sm text-accent-fg"
        >
          Apply
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          action={
            filtered ? (
              <Link
                href={buildHref({ q: "", roleId: "", page: 1 })}
                className="text-sm text-fg underline underline-offset-2"
              >
                Clear filters
              </Link>
            ) : null
          }
        />
      ) : (
        <MembersTable
          rows={rows}
          permissionRoles={permissionRoles}
          footer={
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              total={total}
              hrefFor={(nextPage) => buildHref({ page: nextPage })}
              pageSizeHrefFor={(nextSize) => buildHref({ pageSize: nextSize, page: 1 })}
            />
          }
        />
      )}
    </div>
  );
}
