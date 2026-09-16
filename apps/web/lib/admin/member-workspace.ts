import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export async function memberWorkspaceCounts(organizationId: string) {
  if (isCompassDatabase()) {
    return { people: 0, invites: 0, groups: 0 };
  }

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
