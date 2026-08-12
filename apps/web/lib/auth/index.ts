import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { AppRole } from "@/lib/auth/roles";
import { authConfig } from "@/lib/auth/config";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationId: string;
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
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: { memberships: { take: 1 } },
        });
        if (!user || !user.memberships[0]) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.memberships[0].role as AppRole,
          organizationId: user.memberships[0].organizationId,
        };
      },
    }),
  ],
});

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
