import { GroupsManager } from "@/components/admin/groups-manager";
import { MembersAdminHeader } from "@/components/admin/members-admin-header";
import { memberWorkspaceCounts } from "@/lib/admin/member-workspace";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminGroupsPage() {
  const session = await requireCapability("manageMembers");
  const orgId = session.user.organizationId;
  const isAdmin = session.user.role === "SUPER_ADMIN";

  const [groups, members, counts] = await Promise.all([
    prisma.group.findMany({
      where: { organizationId: orgId },
      orderBy: [{ isArchived: "asc" }, { name: "asc" }],
      include: {
        members: { select: { userId: true } },
        _count: { select: { members: true } },
      },
    }),
    prisma.membership.findMany({
      where: { organizationId: orgId },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        userId: true,
        user: { select: { name: true, email: true } },
      },
    }),
    memberWorkspaceCounts(orgId),
  ]);

  const userIdToMembershipId = new Map(members.map((member) => [member.userId, member.id]));

  return (
    <div>
      <MembersAdminHeader
        title="Groups"
        description="Create cohorts, assign people, archive unused groups, or delete them."
        active="groups"
        counts={counts}
        showRolesLink={isAdmin}
      />
      <GroupsManager
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          description: group.description ?? "",
          memberCount: group._count.members,
          isArchived: group.isArchived,
          memberIds: group.members
            .map((member) => userIdToMembershipId.get(member.userId))
            .filter((id): id is string => Boolean(id)),
        }))}
        memberOptions={members.map((member) => ({
          id: member.id,
          name: member.user.name,
          email: member.user.email,
        }))}
      />
    </div>
  );
}
