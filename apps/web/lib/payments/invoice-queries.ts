import "server-only";

import { getCompassDomainTitle } from "@/lib/compass/domain";
import {
  getCompassTransactionDetail,
  isCompassPaidStatus,
  mapCompassTransactionToInvoicePayment,
} from "@/lib/compass/transactions";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export async function loadStudentInvoicePayment(
  paymentId: string,
  userId: string,
  organizationId: string,
) {
  if (isCompassDatabase()) {
    const row = await getCompassTransactionDetail(paymentId, {
      userId,
      domainId: organizationId,
    });
    if (!row || !isCompassPaidStatus(row.status)) return null;
    const orgTitle = await getCompassDomainTitle(organizationId);
    return mapCompassTransactionToInvoicePayment(row, orgTitle);
  }

  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      organizationId,
      status: "PAID",
      OR: [
        { userId },
        { enrollment: { userId } },
        { application: { applicantId: userId } },
      ],
    },
    include: {
      organization: { select: { title: true } },
      program: { select: { title: true } },
      enrollment: {
        select: {
          program: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
      application: { select: { program: { select: { title: true } } } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function loadAdminInvoicePayment(
  paymentId: string,
  organizationId: string,
) {
  if (isCompassDatabase()) {
    const row = await getCompassTransactionDetail(paymentId, {
      domainId: organizationId,
    });
    if (!row || !isCompassPaidStatus(row.status)) return null;
    const orgTitle = await getCompassDomainTitle(organizationId);
    return mapCompassTransactionToInvoicePayment(row, orgTitle);
  }

  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      organizationId,
      status: "PAID",
    },
    include: {
      organization: { select: { title: true } },
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
  });
}
