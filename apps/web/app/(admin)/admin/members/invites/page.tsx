import { InviteStaffPanel } from "@/components/admin/invite-staff-panel";
import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { InvitesTable } from "@/components/admin/invites-table";
import { EmptyState } from "@/components/ui/empty-state";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminMemberInvitesPage() {
  const session = await requireCapability("manageMembers");
  const orgId = session.user.organizationId;
  const isAdmin = session.user.role === "SUPER_ADMIN";

  const [invites, counts] = await Promise.all([
    prisma.membershipInvite.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { invitedBy: { select: { name: true } } },
    }),
    memberWorkspaceCounts(orgId),
  ]);

  const now = new Date();
  const rows = invites.map((invite) => ({
    id: invite.id,
    email: invite.email,
    name: invite.name,
    roleLabel: ROLE_LABELS[invite.role as AppRole] ?? invite.role,
    status:
      invite.status === "PENDING" && invite.expiresAt.getTime() <= now.getTime()
        ? "EXPIRED"
        : invite.status,
    expiresAt: invite.expiresAt.toISOString(),
    invitedBy: invite.invitedBy.name,
  }));

  return (
    <div>
      <MembersAdminHeader
        title="Staff invites"
        description="Staff join by invitation only. Students continue to self-register."
        active="invites"
        counts={counts}
        showRolesLink={isAdmin}
      />
      <InviteStaffPanel canInviteAdmins={isAdmin} />
      {rows.length === 0 ? (
        <EmptyState
          title="No invitations yet"
          description="Send a staff invitation above. Pending links expire after 7 days."
        />
      ) : (
        <InvitesTable rows={rows} />
      )}
    </div>
  );
}
