"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: passwordSchema,
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isConsented(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

const RESET_GENERIC = {
  ok: true as const,
  message:
    "If an account exists for that email, password reset instructions are available.",
};

export async function registerStudent(formData: FormData) {
  if (process.env.ALLOW_PUBLIC_REGISTRATION === "false") {
    return { error: "Public registration is disabled. Contact admissions." };
  }

  if (!isConsented(formData.get("consent"))) {
    return { error: "You must accept the Terms and Privacy Policy." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ??
      "Please provide a valid name, email, and password (10+ chars with a letter and number).";
    return { error: message };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const orgSlug = process.env.DEFAULT_ORG_SLUG?.trim();
  const org = orgSlug
    ? await prisma.organization.findUnique({ where: { slug: orgSlug } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });

  if (!org) return { error: "Institution is not configured yet." };

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  try {
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        password: hashedPassword,
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

  return { ok: true as const };
}

export async function requestPasswordReset(formData: FormData) {
  const emailRaw = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!emailRaw || !z.string().email().safeParse(emailRaw).success) {
    return RESET_GENERIC;
  }

  const user = await prisma.user.findUnique({ where: { email: emailRaw } });
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

  // No email provider yet — expose reset URL only in non-production.
  if (process.env.NODE_ENV !== "production") {
    console.info("[password-reset] issued for local testing");
    return { ...RESET_GENERIC, resetUrl: resetPath };
  }

  console.info("[password-reset] issued (email delivery not configured)");
  return RESET_GENERIC;
}

export async function resetPassword(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = formData.get("password");
  const confirm = formData.get("confirmPassword");

  if (!token || token.length < 32) {
    return { error: "Reset link is invalid or expired." };
  }

  const passwordParsed = passwordSchema.safeParse(password);
  if (!passwordParsed.success) {
    return {
      error: passwordParsed.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  if (String(confirm ?? "") !== passwordParsed.data) {
    return { error: "Passwords do not match." };
  }

  const tokenHash = hashToken(token);
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

  const hashedPassword = await bcrypt.hash(passwordParsed.data, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword },
    }),
    // Consume all outstanding tokens for this user.
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true as const };
}
