"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function revalidateAccess() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/roles");
}

const roleFieldsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  description: z
    .string()
    .trim()
    .max(240, "Description is too long.")
    .optional()
    .transform((v) => v || null),
});

/** Creates an org-scoped assignable role for the members console. */
export async function createPermissionRole(name: string, description?: string) {
  const session = await requireSuperAdmin();
  const parsed = roleFieldsSchema.safeParse({ name, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid role details." };
  }

  const orgId = session.user.organizationId;
  const base = slugify(parsed.data.name) || "role";
  let slug = base;
  let suffix = 2;
  while (
    await prisma.permissionRole.findFirst({
      where: { organizationId: orgId, slug },
      select: { id: true },
    })
  ) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  await prisma.permissionRole.create({
    data: {
      organizationId: orgId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    },
  });

  revalidateAccess();
  return { ok: true as const };
}

/** Updates a custom role. System roles can only change their description. */
export async function updatePermissionRole(
  roleId: string,
  input: { name?: string; description?: string | null },
) {
  const session = await requireSuperAdmin();
  const parsed = z
    .object({
      roleId: z.string().min(1),
      name: z.string().trim().min(2).max(80).optional(),
      description: z
        .string()
        .trim()
        .max(240)
        .nullable()
        .optional(),
    })
    .safeParse({ roleId, ...input });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid role details." };
  }

  const role = await prisma.permissionRole.findFirst({
    where: { id: parsed.data.roleId, organizationId: session.user.organizationId },
    select: { id: true, isSystem: true },
  });
  if (!role) return { error: "Role not found." };

  const data: { name?: string; description?: string | null } = {};
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description;
  }
  if (parsed.data.name !== undefined) {
    if (role.isSystem) {
      return { error: "System roles cannot be renamed." };
    }
    data.name = parsed.data.name;
  }

  if (Object.keys(data).length === 0) {
    return { error: "Nothing to update." };
  }

  await prisma.permissionRole.update({ where: { id: role.id }, data });
  revalidateAccess();
  return { ok: true as const };
}

/** Deletes a custom role that is not assigned to anyone. */
export async function deletePermissionRole(roleId: string) {
  const session = await requireSuperAdmin();
  const parsed = z.string().min(1).safeParse(roleId);
  if (!parsed.success) return { error: "Invalid role." };

  const role = await prisma.permissionRole.findFirst({
    where: { id: parsed.data, organizationId: session.user.organizationId },
    select: {
      id: true,
      isSystem: true,
      _count: { select: { memberships: true } },
    },
  });
  if (!role) return { error: "Role not found." };
  if (role.isSystem) return { error: "System roles cannot be deleted." };
  if (role._count.memberships > 0) {
    return {
      error: "Remove this role from all members before deleting it.",
    };
  }

  await prisma.permissionRole.delete({ where: { id: role.id } });
  revalidateAccess();
  return { ok: true as const };
}
