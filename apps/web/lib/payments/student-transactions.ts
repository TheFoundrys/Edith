import { listCompassTransactionsForUser } from "@/lib/compass/transactions";
import { getCompassCourseById } from "@/lib/compass/courses";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export async function getStudentPaidPayments(
  userId: string,
  organizationId: string,
  limit = 50,
) {
  if (isCompassDatabase()) {
    const rows = await listCompassTransactionsForUser(userId);
    const paid = rows.filter((t) =>
      ["PAID", "SUCCESS", "COMPLETED"].includes(t.status),
    );
    const limited = paid.slice(0, limit);
    const result = [];
    for (const tx of limited) {
      const program = tx.programId
        ? await getCompassCourseById(tx.programId)
        : null;
      result.push({
        id: tx.id,
        amount: tx.amount,
        currency: tx.currency,
        purpose: "COURSE_FEE" as const,
        status: "PAID" as const,
        provider: "OFFLINE" as const,
        paymentDate: tx.createdAt,
        createdAt: tx.createdAt,
        invoiceId: tx.invoiceId,
        providerPaymentId: null,
        principalAmount: tx.amount,
        discountAmount: 0,
        gstAmount: 0,
        convenienceFee: 0,
        couponCode: null,
        program: program ? { title: program.title } : null,
        enrollment: program
          ? { program: { title: program.title } }
          : null,
        application: null,
      });
    }
    return result;
  }

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
