import { auth } from "@/lib/auth";
import {
  STAFF_ROLES,
  can,
  isStaffRole,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";
import { getCapabilitiesForRole } from "@/lib/auth/org-capabilities";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export { isStaffRole, can };
export type { AppRole, Capability };

export type SessionWithCapabilities = Awaited<ReturnType<typeof requireSession>>;

/** Prefer session capabilities (org matrix); fall back to code defaults. */
export function canUser(
  user: { role: AppRole; capabilities?: Capability[] },
  capability: Capability,
) {
  if (user.capabilities) return user.capabilities.includes(capability);
  return can(user.role, capability);
}

export function isSuperAdmin(role: string | undefined | null) {
  return role === "SUPER_ADMIN";
}

export async function requireSuperAdmin() {
  const session = await requireStaff();
  if (!isSuperAdmin(session.user.role)) redirect("/admin");
  return session;
}

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") {
    redirect("/login");
  }

  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
      },
    },
  });

  if (membership) {
    if (membership.status === "SUSPENDED") {
      redirect("/api/auth/clear-stale?reason=membership_suspended");
    }
    if (membership.expiresAt && membership.expiresAt.getTime() <= Date.now()) {
      redirect("/api/auth/clear-stale?reason=membership_expired");
    }
    const capabilities = await getCapabilitiesForRole(
      membership.organizationId,
      membership.role,
    );
    return {
      ...session,
      user: {
        ...session.user,
        role: membership.role as AppRole,
        organizationId: membership.organizationId,
        capabilities,
      },
    };
  }

  // User id changed after DB reseed — force a fresh login to rewrite the JWT.
  if (session.user.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      include: { memberships: { take: 1 } },
    });
    if (byEmail?.memberships[0]) {
      // clear-stale wipes the cookie; /login?error=session_expired alone races sign-in.
      redirect("/api/auth/clear-stale");
    }
  }

  redirect("/api/auth/clear-stale");
}

export async function requireStaff() {
  const session = await requireSession();
  if (!STAFF_ROLES.includes(session.user.role)) redirect("/student/dashboard");
  return session;
}

/** Staff with a specific capability (e.g. pricing vs content). */
export async function requireCapability(capability: Capability) {
  const session = await requireStaff();
  if (!canUser(session.user, capability)) {
    redirect("/admin");
  }
  return session;
}

export async function requireStudent() {
  const session = await requireSession();
  if (isStaffRole(session.user.role)) redirect("/admin");
  if (session.user.role !== "STUDENT") redirect("/login");
  return session;
}
