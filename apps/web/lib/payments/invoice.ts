import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Stable invoice number for a paid transaction. */
export function buildInvoiceNumber(paymentId: string, paidAt: Date): string {
  const y = paidAt.getUTCFullYear();
  const m = String(paidAt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(paidAt.getUTCDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-${paymentId.slice(-8).toUpperCase()}`;
}

type Tx = Prisma.TransactionClient;

/** Assign invoiceId when a payment is marked paid (idempotent). */
export async function assignInvoiceId(
  paymentId: string,
  paidAt: Date,
  tx?: Tx,
) {
  const client = tx ?? prisma;
  const invoiceId = buildInvoiceNumber(paymentId, paidAt);
  await client.payment.updateMany({
    where: { id: paymentId, invoiceId: null },
    data: { invoiceId },
  });
  return invoiceId;
}

/** Ensure a paid payment has an invoice id (backfill for older rows). */
export async function ensureInvoiceId(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { invoiceId: true, status: true, paymentDate: true, createdAt: true },
  });
  if (!payment || payment.status !== "PAID") return null;
  if (payment.invoiceId) return payment.invoiceId;
  const paidAt = payment.paymentDate ?? payment.createdAt;
  return assignInvoiceId(paymentId, paidAt);
}

export function paymentPurposeLabel(purpose: string): string {
  if (purpose === "COURSE_FEE") return "Course fee";
  if (purpose === "APPLICATION_FEE") return "Application fee";
  return purpose.replace(/_/g, " ").toLowerCase();
}
