import { listCompassTransactionsForUser } from "@/lib/compass/transactions";
import { findCompassCliftonAssessment } from "@/lib/compass/clifton-assessment";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  getPaymentConfig,
  isMockPaymentsAllowed,
} from "@/lib/payments";
import {
  isIdentityComplete,
  isResumeComplete,
} from "@/lib/assessments/personality-kyc";

/** Edith exam unlocks only after a verified course fee — never from enrollment alone. */
export async function hasPaidPersonalityExamAccess(input: {
  userId: string;
  programId: string;
}) {
  if (isCompassDatabase()) {
    const transactions = await listCompassTransactionsForUser(
      input.userId,
      input.programId,
    );
    return transactions.some((tx) =>
      ["PAID", "SUCCESS", "COMPLETED"].includes(tx.status.toUpperCase()),
    );
  }

  const config = getPaymentConfig();
  const paid = await prisma.payment.findFirst({
    where: {
      status: "PAID",
      purpose: "COURSE_FEE",
      userId: input.userId,
      ...(config.adapter === "razorpay"
        ? { provider: "RAZORPAY", providerPaymentId: { not: null } }
        : {}),
      OR: [
        { programId: input.programId },
        { enrollment: { userId: input.userId, programId: input.programId } },
      ],
    },
    select: { id: true },
  });
  return Boolean(paid);
}

export async function personalityExamPrerequisitesMet(input: {
  userId: string;
  organizationId: string;
}) {
  const attempt = isCompassDatabase()
    ? await findCompassCliftonAssessment(input.userId)
    : await prisma.cliftonAssessment.findFirst({
        where: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
        orderBy: { createdAt: "desc" },
        select: { aiMetadata: true },
      });
  const meta =
    attempt?.aiMetadata &&
    typeof attempt.aiMetadata === "object" &&
    !Array.isArray(attempt.aiMetadata)
      ? (attempt.aiMetadata as { kyc?: unknown }).kyc
      : undefined;
  return isIdentityComplete(meta) && isResumeComplete(meta);
}

export type PersonalityPaymentAvailability = {
  available: boolean;
  mode: "razorpay" | "mock" | null;
  message: string | null;
};

/** Fail-closed checkout readiness for the mandatory exam fee. */
export async function getPersonalityPaymentAvailability(
  organizationId: string,
): Promise<PersonalityPaymentAvailability> {
  const config = getPaymentConfig();
  const settings = isCompassDatabase()
    ? null
    : await prisma.paymentSettings.findUnique({
        where: { organizationId },
        select: { razorpayEnabled: true },
      });

  if (config.adapter === "razorpay") {
    if (!config.keyId || !config.keySecret) {
      return {
        available: false,
        mode: null,
        message:
          "Online payment is not configured yet. Ask your campus admin to add Razorpay credentials.",
      };
    }
    const orgEnabled =
      isCompassDatabase() ||
      settings?.razorpayEnabled ||
      (process.env.NODE_ENV !== "production" &&
        Boolean(config.keyId && config.keySecret));
    if (!orgEnabled) {
      return {
        available: false,
        mode: null,
        message:
          "Online payment is turned off for this campus. Contact support to pay the exam fee.",
      };
    }
    return { available: true, mode: "razorpay", message: null };
  }

  if (!isMockPaymentsAllowed()) {
    return {
      available: false,
      mode: null,
      message:
        "Mock payments are disabled in production. Configure Razorpay credentials to collect the exam fee.",
    };
  }

  return {
    available: true,
    mode: "mock",
    message: "Development checkout — no real charge.",
  };
}
