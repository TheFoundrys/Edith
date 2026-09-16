import {
  listCompassTransactionsAdmin,
  mapCompassTransactionToAdminPayment,
} from "@/lib/compass/transactions";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { paymentProgramTitle } from "@/lib/payments/student-transactions";

export async function getAdminPayments(orgId: string, limit = 100) {
  if (isCompassDatabase()) {
    const rows = await listCompassTransactionsAdmin(orgId, limit);
    return rows.map(mapCompassTransactionToAdminPayment);
  }

  return prisma.payment.findMany({
    where: { organizationId: orgId },
    select: {
      id: true,
      amount: true,
      currency: true,
      purpose: true,
      status: true,
      provider: true,
      paymentDate: true,
      createdAt: true,
      invoiceId: true,
      providerPaymentId: true,
      couponCode: true,
      program: { select: { title: true } },
      enrollment: {
        select: {
          program: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
      application: {
        select: {
          program: { select: { title: true } },
          applicant: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export function paymentPayerLabel(payment: {
  user: { name: string; email: string } | null;
  enrollment: { user: { name: string; email: string } } | null;
  application: { applicant: { name: string; email: string } } | null;
}): string {
  const payer =
    payment.user ??
    payment.enrollment?.user ??
    payment.application?.applicant ??
    null;
  return payer ? `${payer.name} · ${payer.email}` : "—";
}

export { paymentProgramTitle };
