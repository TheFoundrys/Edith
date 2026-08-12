import type { NextAuthConfig } from "next-auth";
import type { AppRole } from "@/lib/auth/roles";

/**
 * Edge-safe Auth.js config (no Prisma / Node APIs).
 * Middleware must import this — not `@/lib/auth` — or Prisma will crash in Edge.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.organizationId = user.organizationId;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.organizationId || !token.role) {
        session.error = "InvalidSession";
        return session;
      }

      session.user.id = String(token.id);
      session.user.role = token.role as AppRole;
      session.user.organizationId = String(token.organizationId);
      session.user.email = String(token.email ?? session.user.email ?? "");
      session.user.name = String(token.name ?? session.user.name ?? "");
      return session;
    },
  },
} satisfies NextAuthConfig;
