import { auth } from "@/lib/auth";
import {
  STAFF_ROLES,
  can,
  isStaffRole,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export { isStaffRole, can };
export type { AppRole, Capability };

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") {
    redirect("/login");
  }

  // Node-only membership check (JWT stays Edge-safe; this refreshes after reseeds).
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
  });

  if (membership) {
    return {
      ...session,
      user: {
        ...session.user,
        role: membership.role as AppRole,
        organizationId: membership.organizationId,
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
  if (!can(session.user.role, capability)) {
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
