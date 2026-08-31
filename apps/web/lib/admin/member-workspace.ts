import { prisma } from "@/lib/db";

export async function memberWorkspaceCounts(organizationId: string) {
  const [people, invites, groups] = await Promise.all([
    prisma.membership.count({ where: { organizationId } }),
    prisma.membershipInvite.count({
      where: {
        organizationId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.group.count({ where: { organizationId, isArchived: false } }),
  ]);
  return { people, invites, groups };
}
