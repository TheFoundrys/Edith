import { requestCrmEnrollmentCallback } from "@/lib/crm/enrollment-callback";
import { prisma } from "@/lib/db";
import { crmSyncStatusSafe } from "@/lib/crm";
import type { PaymentProvider } from "@prisma/client";
import { upsertEnrollmentAccess } from "@/lib/enrollment/activation";
import { afterEnrollmentHref, isPersonalityProfileProgram } from "@/lib/assessments/personality-profile";
import { assignInvoiceId } from "@/lib/payments/invoice";

/** Mark a payment paid and enroll the application (idempotent). */
export async function completePaidPayment(opts: {
  paymentId: string;
  providerPaymentId?: string | null;
  providerSignature?: string | null;
  actorId?: string | null;
  note?: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: opts.paymentId },
    include: {
      application: {
        include: {
          program: true,
          applicant: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!payment) return { error: "Payment not found." as const };
  if (!payment.applicationId || !payment.application) {
    return { error: "Payment is not linked to an application." as const };
  }
  if (payment.status === "PAID") {
    return { ok: true as const, alreadyPaid: true, applicationId: payment.applicationId };
  }

  const app = payment.application;
  if (
    app.status !== "FEE_REQUESTED" &&
    app.status !== "OFFERED" &&
    app.status !== "PAYMENT_PENDING" &&
    app.status !== "PAID" &&
    app.status !== "ENROLLED"
  ) {
    return { error: `Cannot enroll from status ${app.status}.` as const };
  }

  const needsCrm = app.program.requiresCrmCallback;
  const targetApplicationStatus = needsCrm ? "PAID" : "ENROLLED";

  const paidAt = new Date();
  const completed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        providerPaymentId: opts.providerPaymentId ?? payment.providerPaymentId,
        providerSignature: opts.providerSignature ?? payment.providerSignature,
        paymentDate: paidAt,
        failureReason: null,
      },
    });
    if (claimed.count === 0) return false;

    await assignInvoiceId(payment.id, paidAt, tx);

    if (app.status !== targetApplicationStatus) {
      await tx.application.update({
        where: { id: app.id },
        data: {
          status: targetApplicationStatus,
          events: {
            create: {
              fromStatus: app.status,
              toStatus: targetApplicationStatus,
              note:
                opts.note ??
                (needsCrm
                  ? "Application fee paid — awaiting CRM confirmation"
                  : "Application fee paid — enrolled"),
              actorId: opts.actorId ?? null,
            },
          },
        },
      });
    }

    await upsertEnrollmentAccess(tx, {
      organizationId: app.organizationId,
      programId: app.programId,
      userId: app.applicantId,
      intakeId: app.intakeId,
      status: needsCrm ? "PENDING" : "ACTIVE",
      amountPaid: payment.amount,
    });
    return true;
  });

  if (!completed) {
    return {
      ok: true as const,
      alreadyPaid: true,
      awaitingCrm: needsCrm,
      applicationId: payment.applicationId,
    };
  }

  if (app.status !== targetApplicationStatus) {
    await crmSyncStatusSafe({
      organizationId: app.organizationId,
      applicationId: app.id,
      externalLeadId: app.crmLeadId,
      externalApplicationId: app.crmApplicationId,
      status: targetApplicationStatus,
      note: opts.note ?? "Fee paid",
    });
  }

  if (needsCrm) {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_programId: {
          userId: app.applicantId,
          programId: app.programId,
        },
      },
    });
    if (enrollment) {
      await requestCrmEnrollmentCallback({
        enrollmentId: enrollment.id,
        user: app.applicant,
        program: app.program,
      });
    }
    return {
      ok: true as const,
      alreadyPaid: false,
      awaitingCrm: true as const,
      applicationId: payment.applicationId,
    };
  }

  const existingNote = await prisma.notification.findFirst({
    where: {
      userId: app.applicantId,
      actionUrl: `/student/learning/${app.programId}`,
      title: "Enrollment confirmed",
    },
  });
  if (!existingNote) {
    await prisma.notification.create({
      data: {
        userId: app.applicantId,
        title: "Enrollment confirmed",
        message: "Your course is unlocked. Open learning to get started.",
        actionUrl: `/student/learning/${app.programId}`,
      },
    });
  }

  return {
    ok: true as const,
    alreadyPaid: false,
    awaitingCrm: false as const,
    applicationId: payment.applicationId,
  };
}

/** Mark a course payment paid and activate enrollment (idempotent). */
export async function completeCoursePayment(opts: {
  paymentId: string;
  providerPaymentId?: string | null;
  providerSignature?: string | null;
  note?: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: opts.paymentId },
    include: { enrollment: true },
  });
  if (!payment) return { error: "Payment not found." as const };
  if (!payment.enrollmentId || !payment.enrollment) {
    return { error: "Payment is not linked to an enrollment." as const };
  }
  if (payment.status === "PAID") {
    return {
      ok: true as const,
      alreadyPaid: true,
      enrollmentId: payment.enrollmentId,
      programId: payment.enrollment.programId,
    };
  }

  const enrollment = payment.enrollment;
  const program = await prisma.program.findUnique({
    where: { id: enrollment.programId },
  });
  if (!program) return { error: "Course not found." as const };

  const needsCrm = program.requiresCrmCallback;

  const paidAt = new Date();
  const completed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: {
        status: "PAID",
        providerPaymentId: opts.providerPaymentId ?? payment.providerPaymentId,
        providerSignature: opts.providerSignature ?? payment.providerSignature,
        paymentDate: paidAt,
        failureReason: null,
      },
    });
    if (claimed.count === 0) return false;

    await assignInvoiceId(payment.id, paidAt, tx);

    if (!needsCrm && enrollment.status !== "ACTIVE") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
          enrolledAt: enrollment.enrolledAt ?? new Date(),
          amountPaid: payment.amount,
        },
      });
    } else {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { amountPaid: payment.amount },
      });
    }

    if (payment.couponCode) {
      await tx.coupon.updateMany({
        where: {
          organizationId: payment.organizationId,
          code: payment.couponCode,
        },
        data: { usedCount: { increment: 1 } },
      });
    }
    return true;
  });

  if (!completed) {
    return {
      ok: true as const,
      alreadyPaid: true,
      awaitingCrm: needsCrm,
      enrollmentId: payment.enrollmentId,
      programId: enrollment.programId,
    };
  }

  if (needsCrm) {
    const user = await prisma.user.findUnique({
      where: { id: enrollment.userId },
      select: { id: true, name: true, email: true },
    });
    if (user) {
      await requestCrmEnrollmentCallback({
        enrollmentId: enrollment.id,
        user,
        program,
      });
    }
    return {
      ok: true as const,
      alreadyPaid: false,
      awaitingCrm: true as const,
      enrollmentId: payment.enrollmentId,
      programId: enrollment.programId,
    };
  }

  if (enrollment.status !== "ACTIVE") {
    await prisma.notification.create({
      data: {
        userId: enrollment.userId,
        title: isPersonalityProfileProgram(program)
          ? "Assessment unlocked"
          : "Enrollment confirmed",
        message: isPersonalityProfileProgram(program)
          ? "Payment received. Your personality profile is unlocked."
          : "Payment received. Your course is unlocked.",
        actionUrl: afterEnrollmentHref(program),
      },
    });
  }

  return {
    ok: true as const,
    alreadyPaid: false,
    awaitingCrm: false as const,
    enrollmentId: payment.enrollmentId,
    programId: enrollment.programId,
  };
}

export async function markPaymentFailed(opts: {
  paymentId: string;
  reason?: string;
}) {
  await prisma.payment.updateMany({
    where: {
      id: opts.paymentId,
      status: { in: ["CREATED", "PENDING"] },
    },
    data: {
      status: "FAILED",
      failureReason: opts.reason ?? "Payment failed",
    },
  });
}

export function providerEnum(provider: "MOCK" | "RAZORPAY" | "OFFLINE"): PaymentProvider {
  return provider;
}
