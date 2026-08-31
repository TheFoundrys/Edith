import { auth, type SessionUser } from "@/lib/auth";
import { getCapabilitiesForRole } from "@/lib/auth/org-capabilities";
import {
  STAFF_ROLES,
  type Capability,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/http";

export type ApiAuthResult =
  | { ok: true; user: SessionUser & { capabilities: Capability[] } }
  | { ok: false; response: Response };

async function resolveSessionUser(): Promise<
  (SessionUser & { capabilities: Capability[] }) | null
> {
  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") return null;

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
      },
    },
  });
  if (!membership) return null;
  if (membership.status === "SUSPENDED") return null;
  if (membership.expiresAt && membership.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const capabilities = await getCapabilitiesForRole(
    membership.organizationId,
    membership.role,
  );

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: membership.role as SessionUser["role"],
    organizationId: membership.organizationId,
    capabilities,
  };
}

export async function requireApiSession(): Promise<ApiAuthResult> {
  const user = await resolveSessionUser();
  if (!user) {
    return { ok: false, response: jsonError("Unauthorized", 401) };
  }
  return { ok: true, user };
}

export async function requireApiCapability(
  capability: Capability,
): Promise<ApiAuthResult> {
  const authResult = await requireApiSession();
  if (!authResult.ok) return authResult;

  if (!STAFF_ROLES.includes(authResult.user.role)) {
    return { ok: false, response: jsonError("Forbidden", 403) };
  }
  if (!authResult.user.capabilities.includes(capability)) {
    return {
      ok: false,
      response: jsonError(`Missing capability: ${capability}`, 403),
    };
  }
  return authResult;
}
