import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import {
  loginSchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
  resetRequestSchema,
} from "../../shared/schemas/auth.js";
import type { SessionUser } from "../../shared/types/session.js";
import { env } from "../config/env.js";
import { prisma } from "../repositories/prisma.js";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

const RESET_GENERIC = {
  ok: true as const,
  message:
    "If an account exists for that email, password reset instructions are available.",
};

export async function login(
  input: unknown,
): Promise<{ user: SessionUser } | { error: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid email or password." };

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { memberships: { take: 1 } },
  });
  if (!user || !user.memberships[0]) {
    return { error: "Invalid email or password." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.memberships[0].role,
      organizationId: user.memberships[0].organizationId,
    },
  };
}

export async function registerStudent(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  if (!env.allowPublicRegistration) {
    return { error: "Public registration is disabled. Contact admissions." };
  }

  const body = input as { consent?: boolean };
  if (body.consent !== true) {
    return { error: "You must accept the Terms and Privacy Policy." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please provide a valid name, email, and password.",
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const org = env.defaultOrgSlug
    ? await prisma.organization.findUnique({ where: { slug: env.defaultOrgSlug } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });

  if (!org) return { error: "Institution is not configured yet." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        memberships: {
          create: { organizationId: org.id, role: "STUDENT" },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "An account with this email already exists." };
    }
    throw error;
  }

  return { ok: true };
}

export async function requestPasswordReset(input: unknown) {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) return RESET_GENERIC;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) return RESET_GENERIC;

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    }),
  ]);

  const resetPath = `/reset-password?token=${token}`;
  if (!env.isProd) {
    console.info("[password-reset] issued for local testing");
    return { ...RESET_GENERIC, resetUrl: resetPath };
  }
  return RESET_GENERIC;
}

export async function resetPassword(input: unknown) {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  if (parsed.data.confirmPassword !== parsed.data.password) {
    return { error: "Passwords do not match." };
  }

  const passwordParsed = passwordSchema.safeParse(parsed.data.password);
  if (!passwordParsed.success) {
    return {
      error: passwordParsed.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(
        () => undefined,
      );
    }
    return { error: "Reset link is invalid or expired." };
  }

  const passwordHash = await bcrypt.hash(passwordParsed.data, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true as const };
}
