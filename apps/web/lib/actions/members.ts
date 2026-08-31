"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { z } from "zod";
import { isAppRole } from "@/lib/auth/roles";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit";

const idSchema = z.string().min(1);
const idListSchema = z.array(idSchema).max(500);

/**
 * A date-only expiry means "access lasts through that day", so it is stored at
 * the end of the day in UTC rather than at midnight.
 */
const expirySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expiry must be a YYYY-MM-DD date.")
  .nullable();

function endOfDayUtc(day: string): Date {
  return new Date(`${day}T23:59:59.999Z`);
}

function revalidateMembers() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/activity");
  revalidatePath("/admin/members/groups");
}

/** Confirms the membership belongs to the caller's organization. */
async function orgMembership(membershipId: string, organizationId: string) {
  return prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    select: { id: true, userId: true, role: true, status: true },
  });
}

/** Replaces the PermissionRole set attached to one membership. */
export async function setMemberRoles(
  membershipId: string,
  permissionRoleIds: string[],
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({ membershipId: idSchema, permissionRoleIds: idListSchema })
    .safeParse({ membershipId, permissionRoleIds });
  if (!parsed.success) return { error: "Invalid role selection." };

  const orgId = session.user.organizationId;
  const membership = await orgMembership(parsed.data.membershipId, orgId);
  if (!membership) return { error: "Member not found." };

  const wanted = [...new Set(parsed.data.permissionRoleIds)];
  if (wanted.length > 0) {
    // Roles are org-scoped, so reject any id from another organization.
    const owned = await prisma.permissionRole.count({
      where: { id: { in: wanted }, organizationId: orgId },
    });
    if (owned !== wanted.length) return { error: "Unknown role selected." };
  }

  await prisma.$transaction([
    prisma.membershipRole.deleteMany({
      where: { membershipId: membership.id, permissionRoleId: { notIn: wanted } },
    }),
    prisma.membershipRole.createMany({
      data: wanted.map((permissionRoleId) => ({
        membershipId: membership.id,
        permissionRoleId,
      })),
      skipDuplicates: true,
    }),
  ]);
  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "MEMBER_PERMISSION_ROLES_UPDATED",
    entityType: "Membership",
    entityId: membership.id,
    metadata: { permissionRoleIds: wanted },
  });

  revalidateMembers();
  return { ok: true as const };
}

/** Sets the staff access level (Membership.role enum) that drives admin routing. */
export async function setMemberStaffRole(membershipId: string, role: string) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({ membershipId: idSchema, role: z.string() })
    .safeParse({ membershipId, role });
  if (!parsed.success || !isAppRole(parsed.data.role)) {
    return { error: "Invalid staff access level." };
  }

  const orgId = session.user.organizationId;
  const membership = await orgMembership(parsed.data.membershipId, orgId);
  if (!membership) return { error: "Member not found." };

  if (
    (membership.role === Role.SUPER_ADMIN ||
      parsed.data.role === Role.SUPER_ADMIN) &&
    session.user.role !== Role.SUPER_ADMIN
  ) {
    return { error: "Only an administrator can change administrator access." };
  }

  if (
    membership.userId === session.user.id &&
    membership.role === Role.SUPER_ADMIN &&
    parsed.data.role !== Role.SUPER_ADMIN
  ) {
    return { error: "You cannot remove your own admin access." };
  }

  if (
    membership.role === Role.SUPER_ADMIN &&
    parsed.data.role !== Role.SUPER_ADMIN
  ) {
    const totalAdmins = await prisma.membership.count({
      where: { organizationId: orgId, role: Role.SUPER_ADMIN },
    });
    if (totalAdmins < 2) {
      return { error: "Keep at least one admin in the organization." };
    }
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: parsed.data.role as Role },
  });
  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "MEMBER_STAFF_ROLE_UPDATED",
    entityType: "Membership",
    entityId: membership.id,
    metadata: { from: membership.role, to: parsed.data.role },
  });

  revalidateMembers();
  return { ok: true as const };
}

/** Sets or clears when a single membership's access ends. */
export async function setMemberExpiry(
  membershipId: string,
  expiresAt: string | null,
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({ membershipId: idSchema, expiresAt: expirySchema })
    .safeParse({ membershipId, expiresAt });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid expiry date." };
  }

  const membership = await orgMembership(
    parsed.data.membershipId,
    session.user.organizationId,
  );
  if (!membership) return { error: "Member not found." };
  if (
    membership.role === Role.SUPER_ADMIN &&
    session.user.role !== Role.SUPER_ADMIN
  ) {
    return { error: "Only an administrator can change administrator expiry." };
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
    },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "MEMBER_EXPIRY_UPDATED",
    entityType: "Membership",
    entityId: membership.id,
    metadata: { expiresAt: parsed.data.expiresAt },
  });

  revalidateMembers();
  return { ok: true as const };
}

/** Sets or clears access expiry for several memberships at once. */
export async function bulkSetExpiry(
  membershipIds: string[],
  expiresAt: string | null,
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({ membershipIds: idListSchema.min(1), expiresAt: expirySchema })
    .safeParse({ membershipIds, expiresAt });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid expiry date." };
  }

  const ids = [...new Set(parsed.data.membershipIds)];
  if (session.user.role !== Role.SUPER_ADMIN) {
    const administrators = await prisma.membership.count({
      where: {
        id: { in: ids },
        organizationId: session.user.organizationId,
        role: Role.SUPER_ADMIN,
      },
    });
    if (administrators > 0) {
      return { error: "Only an administrator can change administrator expiry." };
    }
  }

  const result = await prisma.membership.updateMany({
    where: { id: { in: ids }, organizationId: session.user.organizationId },
    data: {
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
    },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "MEMBER_EXPIRY_BULK_UPDATED",
    entityType: "Membership",
    metadata: { membershipIds: ids, expiresAt: parsed.data.expiresAt },
  });

  revalidateMembers();
  return { ok: true as const, updated: result.count };
}

/**
 * Removes memberships from the organization. Refuses to remove the caller or to
 * empty out the last remaining admin, either of which could lock everyone out.
 */
export async function removeMembers(membershipIds: string[]) {
  const session = await requireCapability("manageMembers");
  const parsed = idListSchema.min(1).safeParse(membershipIds);
  if (!parsed.success) return { error: "Select at least one member to remove." };

  const orgId = session.user.organizationId;
  const ids = [...new Set(parsed.data)];

  const targets = await prisma.membership.findMany({
    where: { id: { in: ids }, organizationId: orgId },
    select: { id: true, userId: true, role: true },
  });
  if (targets.length === 0) return { error: "No matching members found." };

  if (targets.some((m) => m.userId === session.user.id)) {
    return { error: "You cannot remove your own membership." };
  }

  const removingAdmins = targets.filter((m) => m.role === "SUPER_ADMIN").length;
  if (removingAdmins > 0 && session.user.role !== Role.SUPER_ADMIN) {
    return { error: "Only an administrator can remove administrators." };
  }
  if (removingAdmins > 0) {
    const totalAdmins = await prisma.membership.count({
      where: { organizationId: orgId, role: "SUPER_ADMIN" },
    });
    if (totalAdmins - removingAdmins < 1) {
      return { error: "Keep at least one admin in the organization." };
    }
  }

  await prisma.membership.deleteMany({
    where: { id: { in: targets.map((m) => m.id) }, organizationId: orgId },
  });
  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "MEMBERS_REMOVED",
    entityType: "Membership",
    metadata: { membershipIds: targets.map((target) => target.id) },
  });

  revalidateMembers();
  return { ok: true as const, removed: targets.length };
}

/**
 * Adds an existing user to the organization. Membership.role starts at STUDENT
 * (least privilege) because it still drives staff routing; broader access is
 * granted through the PermissionRole assignments.
 */
export async function addMember(
  email: string,
  permissionRoleIds: string[] = [],
  expiresAt: string | null = null,
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Enter a valid email address."),
      permissionRoleIds: idListSchema,
      expiresAt: expirySchema,
    })
    .safeParse({ email, permissionRoleIds, expiresAt });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid member details." };
  }

  const orgId = session.user.organizationId;
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (!user) return { error: "No account exists for that email address." };

  const existing = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    select: { id: true },
  });
  if (existing) return { error: "That account is already a member." };

  const wanted = [...new Set(parsed.data.permissionRoleIds)];
  if (wanted.length > 0) {
    const owned = await prisma.permissionRole.count({
      where: { id: { in: wanted }, organizationId: orgId },
    });
    if (owned !== wanted.length) return { error: "Unknown role selected." };
  }

  const membership = await prisma.membership.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      role: "STUDENT",
      status: "ACTIVE",
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
      roles: {
        create: wanted.map((permissionRoleId) => ({ permissionRoleId })),
      },
    },
  });
  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "MEMBER_ADDED",
    entityType: "Membership",
    entityId: membership.id,
    metadata: {
      userId: user.id,
      permissionRoleIds: wanted,
      expiresAt: parsed.data.expiresAt,
    },
  });

  revalidateMembers();
  return { ok: true as const };
}

async function guardMembershipStatusChange(
  sessionRole: Role,
  membership: { userId: string; role: Role },
  actorUserId: string,
) {
  if (membership.userId === actorUserId) {
    return { error: "You cannot change your own access status." };
  }
  if (membership.role === Role.SUPER_ADMIN && sessionRole !== Role.SUPER_ADMIN) {
    return { error: "Only an administrator can suspend administrators." };
  }
  return null;
}

export async function setMemberStatus(
  membershipId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      membershipId: idSchema,
      status: z.enum(["ACTIVE", "SUSPENDED"]),
    })
    .safeParse({ membershipId, status });
  if (!parsed.success) return { error: "Invalid access status." };

  const membership = await orgMembership(
    parsed.data.membershipId,
    session.user.organizationId,
  );
  if (!membership) return { error: "Member not found." };
  const blocked = await guardMembershipStatusChange(
    session.user.role as Role,
    membership,
    session.user.id,
  );
  if (blocked) return blocked;

  if (
    parsed.data.status === "SUSPENDED" &&
    membership.role === Role.SUPER_ADMIN
  ) {
    const remainingAdmins = await prisma.membership.count({
      where: {
        organizationId: session.user.organizationId,
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
        id: { not: membership.id },
      },
    });
    if (remainingAdmins < 1) {
      return { error: "Keep at least one active administrator." };
    }
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: parsed.data.status,
      suspendedAt: parsed.data.status === "SUSPENDED" ? new Date() : null,
    },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action:
      parsed.data.status === "SUSPENDED"
        ? "MEMBER_SUSPENDED"
        : "MEMBER_REACTIVATED",
    entityType: "Membership",
    entityId: membership.id,
  });

  revalidateMembers();
  return { ok: true as const };
}

export async function bulkSetMemberStatus(
  membershipIds: string[],
  status: "ACTIVE" | "SUSPENDED",
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      membershipIds: idListSchema.min(1),
      status: z.enum(["ACTIVE", "SUSPENDED"]),
    })
    .safeParse({ membershipIds, status });
  if (!parsed.success) return { error: "Select at least one member." };

  const orgId = session.user.organizationId;
  const ids = [...new Set(parsed.data.membershipIds)];
  const targets = await prisma.membership.findMany({
    where: { id: { in: ids }, organizationId: orgId },
    select: { id: true, userId: true, role: true },
  });
  if (targets.length === 0) return { error: "No matching members found." };
  if (targets.some((target) => target.userId === session.user.id)) {
    return { error: "You cannot change your own access status." };
  }

  const adminTargets = targets.filter((target) => target.role === Role.SUPER_ADMIN);
  if (adminTargets.length > 0 && session.user.role !== Role.SUPER_ADMIN) {
    return { error: "Only an administrator can suspend administrators." };
  }
  if (parsed.data.status === "SUSPENDED" && adminTargets.length > 0) {
    const remainingAdmins = await prisma.membership.count({
      where: {
        organizationId: orgId,
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
        id: { notIn: adminTargets.map((target) => target.id) },
      },
    });
    if (remainingAdmins < 1) {
      return { error: "Keep at least one active administrator." };
    }
  }

  const result = await prisma.membership.updateMany({
    where: { id: { in: targets.map((target) => target.id) }, organizationId: orgId },
    data: {
      status: parsed.data.status,
      suspendedAt: parsed.data.status === "SUSPENDED" ? new Date() : null,
    },
  });
  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action:
      parsed.data.status === "SUSPENDED"
        ? "MEMBERS_SUSPENDED"
        : "MEMBERS_REACTIVATED",
    entityType: "Membership",
    metadata: { membershipIds: targets.map((target) => target.id) },
  });

  revalidateMembers();
  return { ok: true as const, updated: result.count };
}
