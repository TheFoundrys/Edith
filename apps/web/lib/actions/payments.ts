"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPaymentAdapter, getPaymentConfig, isMockPaymentsAllowed } from "@/lib/payments";
import { completePaidPayment, providerEnum } from "@/lib/payments/complete";

function revalidatePaymentPaths(applicationId: string | null | undefined) {
  if (applicationId) {
    revalidatePath(`/student/applications/${applicationId}`);
    revalidatePath(`/admin/applications/${applicationId}`);
  }
  revalidatePath("/student/applications");
  revalidatePath("/admin/applications");
}

export async function createApplicationFeeOrder(applicationId: string) {
  const session = await requireSession();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, applicantId: session.user.id },
    include: { program: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!application) return { error: "Application not found." };
  if (application.status !== "FEE_REQUESTED") {
    return { error: "Fee payment is only available after fees are requested." };
  }

  const amount = application.program.applicationFee;
  if (amount == null || amount <= 0) {
    return { error: "This program has no application fee configured." };
  }

  const currency =
    (application.program.tuitionCurrency || "INR").trim().toUpperCase() || "INR";
  const existingPaid = application.payments.find((p) => p.status === "PAID");
  if (existingPaid) {
    return { error: "Fee already paid." };
  }

  // Reuse an open order if still CREATED/PENDING for the same amount.
  const open = application.payments.find(
    (p) =>
      (p.status === "CREATED" || p.status === "PENDING") &&
      p.amount === amount &&
      p.providerOrderId,
  );

  try {
    const adapter = getPaymentAdapter();

    if (open?.providerOrderId) {
      return {
        ok: true as const,
        paymentId: open.id,
        provider: adapter.provider,
        providerOrderId: open.providerOrderId,
        amount: open.amount,
        currency: open.currency,
        checkoutKey:
          adapter.provider === "RAZORPAY" ? getPaymentConfig().keyId ?? null : null,
        checkout: {
          mode: adapter.provider === "RAZORPAY" ? "razorpay" : "mock",
          orderId: open.providerOrderId,
        },
        applicantName: session.user.name,
        applicantEmail: session.user.email,
        programName: application.program.title,
      };
    }

    const order = await adapter.createOrder({
      amount,
      currency,
      receipt: `app_${application.id.slice(0, 20)}`,
      notes: {
        applicationId: application.id,
        programId: application.programId,
        purpose: "APPLICATION_FEE",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        organizationId: application.organizationId,
        applicationId: application.id,
        amount: order.amount,
        currency: order.currency,
        status: "PENDING",
        provider: providerEnum(adapter.provider),
        purpose: "APPLICATION_FEE",
        providerOrderId: order.providerOrderId,
        metadataJson: JSON.stringify({ checkout: order.checkout }),
      },
    });

    return {
      ok: true as const,
      paymentId: payment.id,
      provider: adapter.provider,
      providerOrderId: order.providerOrderId,
      amount: order.amount,
      currency: order.currency,
      checkoutKey: order.checkoutKey,
      checkout: order.checkout,
      applicantName: session.user.name,
      applicantEmail: session.user.email,
      programName: application.program.title,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not start payment.",
    };
  }
}

export async function verifyApplicationFeePayment(input: {
  paymentId: string;
  providerPaymentId: string;
  providerSignature: string;
}) {
  const session = await requireSession();
  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      application: { applicantId: session.user.id },
    },
  });
  if (!payment) return { error: "Payment not found." };
  if (payment.status === "PAID") {
    return { ok: true as const, alreadyPaid: true };
  }
  if (!payment.providerOrderId) {
    return { error: "Payment order is incomplete." };
  }

  try {
    const adapter = getPaymentAdapter();
    if (adapter.provider === "MOCK" && !isMockPaymentsAllowed()) {
      return { error: "Mock payments are disabled in this environment." };
    }
    const valid = await adapter.verifyPayment({
      providerOrderId: payment.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      providerSignature: input.providerSignature,
    });
    if (!valid) return { error: "Payment signature verification failed." };

    const result = await completePaidPayment({
      paymentId: payment.id,
      providerPaymentId: input.providerPaymentId,
      providerSignature: input.providerSignature,
      actorId: session.user.id,
      note: `Fee paid via ${adapter.provider}`,
    });
    if ("error" in result && result.error) return { error: result.error };

    revalidatePaymentPaths(payment.applicationId);
    return { ok: true as const, alreadyPaid: result.alreadyPaid };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Payment verification failed.",
    };
  }
}

/** Instant complete for mock adapter (dev / offline). */
export async function completeMockApplicationFee(paymentId: string) {
  if (!isMockPaymentsAllowed()) {
    return { error: "Mock payments are disabled in this environment." };
  }
  if (getPaymentConfig().adapter !== "mock") {
    return { error: "Mock checkout is not active." };
  }

  const session = await requireSession();
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      application: { applicantId: session.user.id },
      provider: "MOCK",
    },
  });
  if (!payment) return { error: "Mock payment not found." };
  if (payment.status === "PAID") return { ok: true as const };

  const result = await completePaidPayment({
    paymentId: payment.id,
    providerPaymentId: `mock_pay_${Date.now()}`,
    providerSignature: "mock",
    actorId: session.user.id,
    note: "Fee paid (mock checkout)",
  });
  if ("error" in result && result.error) return { error: result.error };

  revalidatePaymentPaths(payment.applicationId);
  return { ok: true as const };
}

/** Staff records an offline / bank transfer payment and enrolls. */
export async function markApplicationFeePaidOffline(
  applicationId: string,
  note?: string,
) {
  const session = await requireCapability("manageApplications");
  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: session.user.organizationId },
    include: { program: true, payments: true },
  });
  if (!application) return { error: "Application not found." };
  if (application.status !== "FEE_REQUESTED" && application.status !== "OFFERED") {
    return { error: "Fee can only be recorded when offered or fee-requested." };
  }

  const amount = application.program.applicationFee;
  if (amount == null || amount <= 0) {
    return { error: "Configure an application fee on the program first." };
  }

  const already = application.payments.find((p) => p.status === "PAID");
  if (already) return { error: "A paid fee already exists for this application." };

  // Ensure status is FEE_REQUESTED before enroll event chain is clear.
  if (application.status === "OFFERED") {
    await prisma.application.update({
      where: { id: application.id },
      data: {
        status: "FEE_REQUESTED",
        events: {
          create: {
            fromStatus: "OFFERED",
            toStatus: "FEE_REQUESTED",
            note: "Fee requested (offline collection)",
            actorId: session.user.id,
          },
        },
      },
    });
  }

  const payment = await prisma.payment.create({
    data: {
      organizationId: application.organizationId,
      applicationId: application.id,
      amount,
      currency: application.program.tuitionCurrency || "INR",
      status: "PENDING",
      provider: "OFFLINE",
      purpose: "APPLICATION_FEE",
      providerOrderId: `offline_${application.id.slice(0, 12)}_${Date.now()}`,
      metadataJson: JSON.stringify({ recordedBy: session.user.id }),
    },
  });

  const result = await completePaidPayment({
    paymentId: payment.id,
    providerPaymentId: `offline_${Date.now()}`,
    actorId: session.user.id,
    note: note?.trim() || "Application fee recorded offline",
  });
  if ("error" in result && result.error) return { error: result.error };

  revalidatePaymentPaths(application.id);
  return { ok: true as const };
}
