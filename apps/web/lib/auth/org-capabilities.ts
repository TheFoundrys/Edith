import "server-only";

import { cache } from "react";
import {
  ALL_CAPABILITIES,
  DEFAULT_ROLE_CAPABILITIES,
  ENUM_TO_PERMISSION_SLUG,
  STAFF_MATRIX_ROLES,
  isAppRole,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db";

function parseCapabilities(values: string[]): Capability[] {
  const allowed = new Set<string>(ALL_CAPABILITIES);
  return values.filter((v): v is Capability => allowed.has(v));
}

/** Loads the org capability matrix from system PermissionRole rows. */
export const loadOrgCapabilityMatrix = cache(
  async (organizationId: string): Promise<Record<AppRole, Capability[]>> => {
    const roles = await prisma.permissionRole.findMany({
      where: { organizationId, isSystem: true },
      select: { slug: true, permissions: true },
    });

    const bySlug = new Map(roles.map((r) => [r.slug, r.permissions]));

    const matrix = { ...DEFAULT_ROLE_CAPABILITIES };
    for (const appRole of STAFF_MATRIX_ROLES) {
      const slug = ENUM_TO_PERMISSION_SLUG[appRole];
      const stored = bySlug.get(slug);
      if (stored && stored.length > 0) {
        matrix[appRole] = parseCapabilities(stored);
      }
    }
    return matrix;
  },
);

export async function getCapabilitiesForRole(
  organizationId: string,
  role: string | undefined | null,
): Promise<Capability[]> {
  if (!isAppRole(role)) return [];
  const matrix = await loadOrgCapabilityMatrix(organizationId);
  return matrix[role];
}

export async function orgCan(
  organizationId: string,
  role: string | undefined | null,
  capability: Capability,
): Promise<boolean> {
  const caps = await getCapabilitiesForRole(organizationId, role);
  return caps.includes(capability);
}

export function permissionSlugForRole(role: AppRole) {
  return ENUM_TO_PERMISSION_SLUG[role];
}
