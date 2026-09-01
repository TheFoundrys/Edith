import { prisma } from "@/lib/db";

export async function getStudentPaidPayments(
  userId: string,
  organizationId: string,
  limit = 50,
) {
  return prisma.payment.findMany({
    where: {
      organizationId,
      status: "PAID",
      OR: [
        { userId },
        { enrollment: { userId } },
        { application: { applicantId: userId } },
      ],
    },
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
      principalAmount: true,
      discountAmount: true,
      gstAmount: true,
      convenienceFee: true,
      couponCode: true,
      program: { select: { title: true } },
      enrollment: {
        select: { program: { select: { title: true } } },
      },
      application: {
        select: { program: { select: { title: true } } },
      },
    },
    orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export function paymentProgramTitle(payment: {
  program: { title: string } | null;
  enrollment: { program: { title: string } } | null;
  application: { program: { title: string } } | null;
}): string {
  return (
    payment.program?.title ??
    payment.enrollment?.program.title ??
    payment.application?.program.title ??
    "Programme"
  );
}
