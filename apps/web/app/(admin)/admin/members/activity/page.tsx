import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/page";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { requireCapability } from "@/lib/auth/session";
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

export default async function AdminMembersActivityPage() {
  const session = await requireCapability("manageMembers");
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
        title="Activity"
        description="Immutable record of invitations, access changes, suspensions, and group updates."
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
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-fg-muted">
                    {log.createdAt.toLocaleString()}
                  </td>
                  <td className="px-5 py-3">{log.adminName}</td>
                  <td className="px-5 py-3">
                    {MEMBER_ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-5 py-3 text-fg-muted">
                    {log.entityType ?? "—"}
                    {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
