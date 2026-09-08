"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  ALL_CAPABILITIES,
  DEFAULT_ROLE_CAPABILITIES,
  ENUM_TO_PERMISSION_SLUG,
  STAFF_MATRIX_ROLES,
  isAppRole,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

const capabilitySchema = z.enum(ALL_CAPABILITIES as [Capability, ...Capability[]]);

function revalidateAccess() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/members/roles");
  revalidatePath("/admin");
}

/** Saves capabilities for one staff access level. */
export async function setStaffRoleCapabilities(
  appRole: string,
  capabilities: string[],
) {
  const session = await requireSuperAdmin();
  if (!isAppRole(appRole) || !STAFF_MATRIX_ROLES.includes(appRole)) {
    return { error: "Invalid staff access level." };
  }

  const parsed = z
    .array(capabilitySchema)
    .safeParse([...new Set(capabilities)]);
  if (!parsed.success) {
    return { error: "Invalid capability selection." };
  }

  const orgId = session.user.organizationId;
  const slug = ENUM_TO_PERMISSION_SLUG[appRole as AppRole];

  // Never leave the org without an admin who can manage access.
  if (appRole === "SUPER_ADMIN" && !parsed.data.includes("manageMembers")) {
    return {
      error:
        "Super Administrator must keep staff allocation so someone can manage roles.",
    };
  }

  const role = await prisma.permissionRole.findFirst({
    where: { organizationId: orgId, slug, isSystem: true },
    select: { id: true },
  });
  if (!role) {
    return { error: "System role not found. Re-run the database seed." };
  }

  await prisma.permissionRole.update({
    where: { id: role.id },
    data: { permissions: parsed.data },
  });

  revalidateAccess();
  return { ok: true as const };
}

/** Restores one staff access level to the product defaults. */
export async function resetStaffRoleCapabilities(appRole: string) {
  const session = await requireSuperAdmin();
  if (!isAppRole(appRole) || !STAFF_MATRIX_ROLES.includes(appRole)) {
    return { error: "Invalid staff access level." };
  }

  const orgId = session.user.organizationId;
  const slug = ENUM_TO_PERMISSION_SLUG[appRole as AppRole];
  const defaults = DEFAULT_ROLE_CAPABILITIES[appRole as AppRole];

  const role = await prisma.permissionRole.findFirst({
    where: { organizationId: orgId, slug, isSystem: true },
    select: { id: true },
  });
  if (!role) {
    return { error: "System role not found. Re-run the database seed." };
  }

  await prisma.permissionRole.update({
    where: { id: role.id },
    data: { permissions: defaults },
  });

  revalidateAccess();
  return { ok: true as const };
}
