import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { AppRole, Capability } from "@/lib/auth/roles";
import { authConfig } from "@/lib/auth/config";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { canAuthenticateMembership } from "@/lib/members/status";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationId: string;
  /** Populated by requireSession from the org capability matrix. */
  capabilities?: Capability[];
};

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    error?: string;
  }

  interface User {
    role: AppRole;
    organizationId: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const forwardedFor = request.headers.get("x-forwarded-for");
        const clientAddress =
          forwardedFor?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          "unknown";
        const loginLimit = await consumeRateLimit({
          action: "login",
          identifier: `${parsed.data.email}:${clientAddress}`,
          limit: 10,
          windowMs: 15 * 60 * 1000,
        });
        if (!loginLimit.allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            memberships: {
              where: { status: "ACTIVE" },
              orderBy: { createdAt: "asc" },
              take: 5,
            },
          },
        });
        if (!user) return null;
        const membership = user.memberships.find((item) =>
          canAuthenticateMembership(item),
        );
        if (!membership) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: membership.role as AppRole,
          organizationId: membership.organizationId,
        };
      },
    }),
  ],
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
