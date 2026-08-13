"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

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
}

/** Confirms the membership belongs to the caller's organization. */
async function orgMembership(membershipId: string, organizationId: string) {
  return prisma.membership.findFirst({
    where: { id: membershipId, organizationId },
    select: { id: true, userId: true, role: true },
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

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
    },
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
  const result = await prisma.membership.updateMany({
    where: { id: { in: ids }, organizationId: session.user.organizationId },
    data: {
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
    },
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

  await prisma.membership.create({
    data: {
      organizationId: orgId,
      userId: user.id,
      role: "STUDENT",
      expiresAt: parsed.data.expiresAt ? endOfDayUtc(parsed.data.expiresAt) : null,
      roles: {
        create: wanted.map((permissionRoleId) => ({ permissionRoleId })),
      },
    },
  });

  revalidateMembers();
  return { ok: true as const };
}
