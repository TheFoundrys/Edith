import { formatDistanceToNow } from "date-fns";
import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/page";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { requireCapability } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";

const MEMBER_ACTION_LABELS: Record<string, string> = {
  STAFF_INVITED: "Staff invited",
  STAFF_INVITE_REVOKED: "Invitation revoked",
  MEMBER_ADDED: "Member added",
  MEMBER_STAFF_ROLE_UPDATED: "Access level changed",
  MEMBER_PERMISSION_ROLES_UPDATED: "Labels updated",
  MEMBER_EXPIRY_UPDATED: "Expiry updated",
  MEMBER_EXPIRY_BULK_UPDATED: "Expiry updated in bulk",
  MEMBER_SUSPENDED: "Member suspended",
  MEMBER_REACTIVATED: "Member restored",
  MEMBERS_SUSPENDED: "Members suspended",
  MEMBERS_REACTIVATED: "Members restored",
  MEMBERS_REMOVED: "Members removed",
  GROUP_CREATED: "Group created",
  GROUP_UPDATED: "Group updated",
  GROUP_ARCHIVED: "Group archived",
  GROUP_RESTORED: "Group restored",
  GROUP_DELETED: "Group deleted",
  GROUP_MEMBERS_UPDATED: "Group members updated",
};

function activityTarget(log: {
  entityType: string | null;
  targetResource: string;
  metadata: unknown;
}) {
  const meta =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : {};
  if (typeof meta.email === "string" && meta.email.trim()) return meta.email;
  if (typeof meta.name === "string" && meta.name.trim()) return meta.name;
  if (log.targetResource && log.targetResource !== "-") return log.targetResource;
  if (typeof meta.memberCount === "number") {
    return `${meta.memberCount} member${meta.memberCount === 1 ? "" : "s"}`;
  }
  return log.entityType ?? "Organization";
}

export default async function AdminMembersActivityPage() {
  const session = await requireCapability("manageMembers");
  redirectIfCompassAdminRoute();
  const orgId = session.user.organizationId;
  const isAdmin = session.user.role === "SUPER_ADMIN";

  const [logs, counts] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        organizationId: orgId,
        action: { in: Object.keys(MEMBER_ACTION_LABELS) },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    memberWorkspaceCounts(orgId),
  ]);

  return (
    <div>
      <MembersAdminHeader
        description="A record of invitations, access changes, suspensions, and group updates."
        active="activity"
        counts={counts}
        showRolesLink={isAdmin}
      />
      {logs.length === 0 ? (
        <EmptyState
          title="No member activity yet"
          description="Invites, role changes, suspensions, and group updates will appear here."
        />
      ) : (
        <Panel>
          <ol className="divide-y divide-border">
            {logs.map((log) => (
              <li key={log.id} className="flex flex-wrap gap-3 px-4 py-3 sm:gap-6">
                <p
                  className="w-36 shrink-0 text-xs text-fg-muted tabular-nums"
                  title={log.createdAt.toLocaleString()}
                >
                  {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                </p>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {MEMBER_ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {log.adminName} · {activityTarget(log)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
