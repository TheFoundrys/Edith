"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { recordAudit } from "@/lib/audit";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const idSchema = z.string().min(1);
const nameSchema = z.string().trim().min(2).max(80);

function revalidateGroups() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/groups");
  revalidatePath("/admin/members/activity");
}

export async function createGroup(input: { name: string; description?: string }) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      name: nameSchema,
      description: z.string().trim().max(280).optional().or(z.literal("")),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid group details." };
  }

  const duplicate = await prisma.group.findFirst({
    where: {
      organizationId: session.user.organizationId,
      name: { equals: parsed.data.name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (duplicate) return { error: "A group with that name already exists." };

  try {
    const group = await prisma.group.create({
      data: {
        organizationId: session.user.organizationId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        isActive: true,
        isArchived: false,
      },
    });
    await recordAudit({
      organizationId: session.user.organizationId,
      actor: session.user,
      action: "GROUP_CREATED",
      entityType: "Group",
      entityId: group.id,
      metadata: { name: group.name },
    });
    revalidateGroups();
    return { ok: true as const, id: group.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A group with that name already exists." };
    }
    throw error;
  }
}

export async function updateGroup(
  groupId: string,
  input: { name: string; description?: string },
) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      groupId: idSchema,
      name: nameSchema,
      description: z.string().trim().max(280).optional().or(z.literal("")),
    })
    .safeParse({ groupId, ...input });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid group details." };
  }

  const existing = await prisma.group.findFirst({
    where: { id: parsed.data.groupId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!existing) return { error: "Group not found." };

  const duplicate = await prisma.group.findFirst({
    where: {
      organizationId: session.user.organizationId,
      id: { not: existing.id },
      name: { equals: parsed.data.name, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (duplicate) return { error: "A group with that name already exists." };

  try {
    await prisma.group.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A group with that name already exists." };
    }
    throw error;
  }

  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "GROUP_UPDATED",
    entityType: "Group",
    entityId: existing.id,
    metadata: { name: parsed.data.name },
  });
  revalidateGroups();
  return { ok: true as const };
}

export async function setGroupArchived(groupId: string, archived: boolean) {
  const session = await requireCapability("manageMembers");
  const group = await prisma.group.findFirst({
    where: { id: groupId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!group) return { error: "Group not found." };

  await prisma.group.update({
    where: { id: group.id },
    data: { isArchived: archived, isActive: !archived },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: archived ? "GROUP_ARCHIVED" : "GROUP_RESTORED",
    entityType: "Group",
    entityId: group.id,
  });
  revalidateGroups();
  return { ok: true as const };
}

export async function deleteGroup(groupId: string) {
  const session = await requireCapability("manageMembers");
  const group = await prisma.group.findFirst({
    where: { id: groupId, organizationId: session.user.organizationId },
    select: { id: true, name: true },
  });
  if (!group) return { error: "Group not found." };

  await prisma.group.delete({ where: { id: group.id } });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "GROUP_DELETED",
    entityType: "Group",
    entityId: group.id,
    metadata: { name: group.name },
  });
  revalidateGroups();
  return { ok: true as const };
}

export async function setGroupMembers(groupId: string, membershipIds: string[]) {
  const session = await requireCapability("manageMembers");
  const parsed = z
    .object({
      groupId: idSchema,
      membershipIds: z.array(idSchema).max(1000),
    })
    .safeParse({ groupId, membershipIds });
  if (!parsed.success) return { error: "Invalid member selection." };

  const orgId = session.user.organizationId;
  const group = await prisma.group.findFirst({
    where: { id: parsed.data.groupId, organizationId: orgId },
    select: { id: true },
  });
  if (!group) return { error: "Group not found." };

  const wanted = [...new Set(parsed.data.membershipIds)];
  const members = wanted.length
    ? await prisma.membership.findMany({
        where: { id: { in: wanted }, organizationId: orgId },
        select: { userId: true },
      })
    : [];
  if (members.length !== wanted.length) {
    return { error: "One or more selected members are not in this organization." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userGroup.deleteMany({ where: { groupId: group.id } });
    if (members.length === 0) return;
    await tx.userGroup.createMany({
      data: members.map((member) => ({
        groupId: group.id,
        userId: member.userId,
      })),
    });
  });

  await recordAudit({
    organizationId: orgId,
    actor: session.user,
    action: "GROUP_MEMBERS_UPDATED",
    entityType: "Group",
    entityId: group.id,
    metadata: { memberCount: members.length },
  });
  revalidateGroups();
  return { ok: true as const };
}
