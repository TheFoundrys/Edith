import { auth, type SessionUser } from "@/lib/auth";
import {
  STAFF_ROLES,
  can,
  type Capability,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api/http";

export type ApiAuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response };

async function resolveSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: membership.role as SessionUser["role"],
    organizationId: membership.organizationId,
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
  if (!can(authResult.user.role, capability)) {
    return {
      ok: false,
      response: jsonError(`Missing capability: ${capability}`, 403),
    };
  }
  return authResult;
}
