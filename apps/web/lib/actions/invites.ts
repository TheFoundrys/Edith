"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { isStaffRole, ROLE_LABELS, type AppRole } from "@/lib/auth/roles";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  publicAppOrigin,
  sendMembershipInviteEmail,
} from "@/lib/email/membership-invite";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { revalidatePath } from "next/cache";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STAFF_INVITE_ROLES = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
  "COUNSELOR",
  "CONTENT_UPLOADER",
] as const;

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function revalidateMemberAdmin() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/invites");
  revalidatePath("/admin/members/activity");
}

export async function inviteStaffMember(input: {
  email: string;
  name?: string;
  role: string;
}) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email("Enter a valid email address."),
      name: z.string().trim().min(2).max(120).optional().or(z.literal("")),
      role: z.enum(STAFF_INVITE_ROLES),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invitation." };
  }

  if (
    parsed.data.role === "SUPER_ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return { error: "Only an administrator can invite administrators." };
  }

  const orgId = session.user.organizationId;
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      memberships: {
        where: { organizationId: orgId },
        select: { id: true },
      },
    },
  });
  if (existingUser?.memberships[0]) {
    return { error: "That account is already a member of this organization." };
  }

  const pending = await prisma.membershipInvite.findFirst({
    where: {
      organizationId: orgId,
      email: parsed.data.email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (pending) {
    return { error: "A pending invitation already exists for that email." };
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { title: true },
  });

  const token = randomBytes(32).toString("hex");
  const invite = await prisma.membershipInvite.create({
    data: {
      organizationId: orgId,
      email: parsed.data.email,
      name: parsed.data.name || null,
      role: parsed.data.role as Role,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      invitedById: session.user.id,
    },
  });

  const origin = publicAppOrigin();
  const inviteUrl = origin ? `${origin}/invite/${token}` : `/invite/${token}`;
  if (origin) {
    await sendMembershipInviteEmail({
      email: parsed.data.email,
      inviteUrl,
      organizationName: org?.title || "your institution",
      roleLabel: ROLE_LABELS[parsed.data.role],
    });
  }

  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "STAFF_INVITED",
    entityType: "MembershipInvite",
    entityId: invite.id,
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });
  revalidateMemberAdmin();
  return { ok: true as const, inviteUrl };
}

export async function revokeStaffInvite(inviteId: string) {
  const session = await requireCapability("manageMembers");
  const invite = await prisma.membershipInvite.findFirst({
    where: {
      id: inviteId,
      organizationId: session.user.organizationId,
      status: "PENDING",
    },
  });
  if (!invite) return { error: "Invitation not found." };
  if (invite.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "Only an administrator can revoke administrator invitations." };
  }

  await prisma.membershipInvite.update({
    where: { id: invite.id },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "STAFF_INVITE_REVOKED",
    entityType: "MembershipInvite",
    entityId: invite.id,
    metadata: { email: invite.email },
  });
  revalidateMemberAdmin();
  return { ok: true as const };
}

export async function getInvitePreview(token: string) {
  if (!token || token.length < 32) return { error: "Invitation link is invalid." };
  const invite = await prisma.membershipInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { organization: { select: { title: true } } },
  });
  if (!invite || invite.status !== "PENDING") {
    return { error: "Invitation link is invalid or has already been used." };
  }
  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.membershipInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { error: "This invitation has expired. Ask an administrator to send a new one." };
  }
  return {
    ok: true as const,
    email: invite.email,
    name: invite.name ?? "",
    organizationName: invite.organization.title,
    roleLabel: ROLE_LABELS[invite.role as AppRole],
  };
}

export async function acceptStaffInvite(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token || token.length < 32) {
    return { error: "Invitation link is invalid or expired." };
  }

  const limit = await consumeRateLimit({
    action: "staff-invite-accept",
    identifier: token,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) {
    return { error: "Too many attempts. Request a new invitation." };
  }

  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .safeParse({
      name: formData.get("name"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invitation details." };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const invite = await prisma.membershipInvite.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!invite || invite.status !== "PENDING") {
    return { error: "Invitation link is invalid or has already been used." };
  }
  if (invite.expiresAt.getTime() <= Date.now()) {
    await prisma.membershipInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { error: "This invitation has expired." };
  }
  if (!isStaffRole(invite.role)) {
    return { error: "This invitation is no longer valid." };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.membershipInvite.updateMany({
        where: { id: invite.id, status: "PENDING" },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new Error("Invitation already used.");
      }

      const user = await tx.user.upsert({
        where: { email: invite.email },
        update: {
          name: parsed.data.name,
          password: hashedPassword,
          status: "ACTIVE",
        },
        create: {
          email: invite.email,
          name: parsed.data.name,
          password: hashedPassword,
          status: "ACTIVE",
        },
      });

      await tx.membership.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: user.id,
          },
        },
        create: {
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
          status: "ACTIVE",
        },
        update: {
          role: invite.role,
          status: "ACTIVE",
          suspendedAt: null,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "An account with this email already exists." };
    }
    return { error: error instanceof Error ? error.message : "Could not accept invitation." };
  }

  return { ok: true as const };
}
