import { requestCrmEnrollmentCallback } from "@/lib/crm/enrollment-callback";
import { prisma } from "@/lib/db";
import { crmSyncStatusSafe } from "@/lib/crm";
import type { PaymentProvider } from "@prisma/client";

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
    include: { application: true },
  });
  if (!payment) return { error: "Payment not found." as const };
  if (!payment.applicationId || !payment.application) {
    return { error: "Payment is not linked to an application." as const };
  }
  if (payment.status === "PAID") {
    return { ok: true as const, alreadyPaid: true, applicationId: payment.applicationId };
  }

  const app = payment.application;
  if (app.status !== "FEE_REQUESTED" && app.status !== "OFFERED" && app.status !== "ENROLLED") {
    return { error: `Cannot enroll from status ${app.status}.` as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerPaymentId: opts.providerPaymentId ?? payment.providerPaymentId,
        providerSignature: opts.providerSignature ?? payment.providerSignature,
        paymentDate: new Date(),
        failureReason: null,
      },
    });

    if (app.status !== "ENROLLED") {
      await tx.application.update({
        where: { id: app.id },
        data: {
          status: "ENROLLED",
          events: {
            create: {
              fromStatus: app.status,
              toStatus: "ENROLLED",
              note: opts.note ?? "Application fee paid — enrolled",
              actorId: opts.actorId ?? null,
            },
          },
        },
      });
    }

    // Keep learning access in sync with the Enrollment model.
    await tx.enrollment.upsert({
      where: {
        userId_programId: {
          userId: app.applicantId,
          programId: app.programId,
        },
      },
      create: {
        organizationId: app.organizationId,
        programId: app.programId,
        userId: app.applicantId,
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
      update: {
        status: "ACTIVE",
        enrolledAt: new Date(),
      },
    });
  });

  if (app.status !== "ENROLLED") {
    await crmSyncStatusSafe({
      organizationId: app.organizationId,
      applicationId: app.id,
      externalLeadId: app.crmLeadId,
      externalApplicationId: app.crmApplicationId,
      status: "ENROLLED",
      note: opts.note ?? "Fee paid",
    });
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

  return { ok: true as const, alreadyPaid: false, applicationId: payment.applicationId };
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

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerPaymentId: opts.providerPaymentId ?? payment.providerPaymentId,
        providerSignature: opts.providerSignature ?? payment.providerSignature,
        paymentDate: new Date(),
        failureReason: null,
      },
    });

    if (!needsCrm && enrollment.status !== "ACTIVE") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ACTIVE",
          enrolledAt: enrollment.enrolledAt ?? new Date(),
        },
      });
    }
  });

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
        title: "Enrollment confirmed",
        message: "Payment received. Your course is unlocked.",
        actionUrl: `/student/learning/${enrollment.programId}`,
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
  await prisma.payment.update({
    where: { id: opts.paymentId },
    data: {
      status: "FAILED",
      failureReason: opts.reason ?? "Payment failed",
    },
  });
}

export function providerEnum(provider: "MOCK" | "RAZORPAY" | "OFFLINE"): PaymentProvider {
  return provider;
}
