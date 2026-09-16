"use server";

import { revalidatePath } from "next/cache";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getOrganizationPaymentSettings } from "@/lib/payments/settings-queries";
import { getPaymentAdapter, getPaymentConfig, isMockPaymentsAllowed } from "@/lib/payments";
import { completePaidPayment, providerEnum } from "@/lib/payments/complete";

export async function createInstallmentAction(formData: FormData) {
  await createInstallment(formData);
}

export async function createInstallment(formData: FormData) {
  if (isCompassDatabase()) {
    return { error: "Installments are not available on compass_dev." };
  }
  const session = await requireCapability("managePricing");
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const dueDateRaw = String(formData.get("dueDate") || "").trim();

  if (!email || !title || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Email, title, and a positive amount are required." };
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      memberships: { some: { organizationId: session.user.organizationId } },
    },
    select: { id: true },
  });
  if (!user) return { error: "No student found with that email." };

  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (dueDateRaw && Number.isNaN(dueDate?.getTime())) {
    return { error: "Due date is invalid." };
  }

  await prisma.installment.create({
    data: {
      organizationId: session.user.organizationId,
      userId: user.id,
      title,
      label: title,
      amount,
      dueDate,
      status: "PENDING",
    },
  });

  revalidatePath("/admin/payment-settings");
  revalidatePath("/student/transactions");
  return { ok: true as const };
}

export async function startInstallmentPayment(installmentId: string) {
  if (isCompassDatabase()) {
    return { error: "Installments are not available on compass_dev." };
  }
  const session = await requireStudent();
  const installment = await prisma.installment.findFirst({
    where: {
      id: installmentId,
      organizationId: session.user.organizationId,
      userId: session.user.id,
      status: "PENDING",
    },
  });
  if (!installment) return { error: "Installment not found." };

  const remaining = installment.amount - installment.paidAmount;
  if (remaining <= 0) return { error: "This installment is already paid." };

  const settings = await getOrganizationPaymentSettings(
    session.user.organizationId,
  );
  const currency = settings?.currency ?? "INR";

  const existing = await prisma.payment.findFirst({
    where: {
      installmentId: installment.id,
      status: { in: ["CREATED", "PENDING"] },
      providerOrderId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  try {
    const adapter = getPaymentAdapter();
    if (existing?.providerOrderId) {
      return {
        ok: true as const,
        paymentId: existing.id,
        provider: adapter.provider,
        providerOrderId: existing.providerOrderId,
        amount: existing.amount,
        currency: existing.currency,
        checkoutKey:
          adapter.provider === "RAZORPAY" ? getPaymentConfig().keyId ?? null : null,
        checkout: JSON.parse(existing.metadataJson || "{}").checkout ?? {
          mode: adapter.provider === "MOCK" ? "mock" : "razorpay",
          orderId: existing.providerOrderId,
        },
      };
    }

    const order = await adapter.createOrder({
      amount: remaining,
      currency,
      receipt: `inst_${installment.id.slice(0, 16)}`,
      notes: { installmentId: installment.id, purpose: "INSTALLMENT" },
    });

    const payment = await prisma.payment.create({
      data: {
        organizationId: installment.organizationId,
        amount: order.amount,
        currency: order.currency,
        status: "PENDING",
        provider: providerEnum(adapter.provider),
        purpose: "INSTALLMENT",
        paymentType: "PARTIAL",
        installmentId: installment.id,
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
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not start installment payment.",
    };
  }
}

export async function completeMockInstallmentPayment(paymentId: string) {
  if (!isMockPaymentsAllowed()) {
    return { error: "Mock payments are disabled in this environment." };
  }
  const session = await requireStudent();
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      installmentId: { not: null },
      provider: "MOCK",
    },
    include: { installment: true },
  });
  if (!payment?.installment || payment.installment.userId !== session.user.id) {
    return { error: "Payment not found." };
  }
  if (payment.status === "PAID") return { ok: true as const };

  const result = await completePaidPayment({
    paymentId: payment.id,
    providerPaymentId: `mock_inst_${Date.now()}`,
    providerSignature: "mock",
    actorId: session.user.id,
    note: "Installment paid (mock checkout)",
  });
  if ("error" in result && result.error) return { error: result.error };

  if (payment.installment) {
    const paidTotal = payment.installment.paidAmount + payment.amount;
    await prisma.installment.update({
      where: { id: payment.installment.id },
      data: {
        paidAmount: paidTotal,
        status: paidTotal >= payment.installment.amount ? "PAID" : "PENDING",
      },
    });
  }

  revalidatePath("/student/transactions");
  return { ok: true as const };
}
