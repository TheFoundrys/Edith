"use server";

import { revalidatePath } from "next/cache";
import { requestCrmEnrollmentCallback } from "@/lib/crm/enrollment-callback";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getPaymentAdapter, getPaymentConfig, isMockPaymentsAllowed } from "@/lib/payments";
import {
  completeCoursePayment,
  markPaymentFailed,
  providerEnum,
} from "@/lib/payments/complete";

import { isFreeCourse } from "@/lib/programs/pricing";
import { buildCourseQuote } from "@/lib/payments/quote";
import {
  afterEnrollmentHref,
  isPersonalityProfileProgram,
  PERSONALITY_PROFILE_HREF,
} from "@/lib/assessments/personality-profile";

function revalidateEnrollmentPaths(programId: string) {
  revalidatePath("/student/dashboard");
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath("/student/learning");
  revalidatePath(`/student/learning/${programId}`);
  revalidatePath("/student/progress");
  revalidatePath("/student/notifications");
  revalidatePath("/checkout");
  revalidatePath("/courses");
  revalidatePath(PERSONALITY_PROFILE_HREF);
}

async function notifyEnrollment(
  userId: string,
  program: { id: string; title: string; slug?: string | null; domainSlug?: string | null; sku?: string | null },
) {
  const assessment = isPersonalityProfileProgram(program);
  await prisma.notification.create({
    data: {
      userId,
      title: assessment ? "Assessment unlocked" : "Enrollment confirmed",
      message: assessment
        ? `You’re enrolled in ${program.title}. Open the assessment to start aptitude, quantitative and psyche analysis.`
        : `You’re enrolled in ${program.title}. Open the course to start learning.`,
      actionUrl: afterEnrollmentHref(program),
    },
  });
}

async function programCapacityError(
  program: { id: string; capacity: number | null },
  userId: string,
  intake?: { id: string; capacity: number | null } | null,
) {
  const capacity = intake?.capacity ?? program.capacity;
  if (capacity == null) return null;
  const reservedSeats = await prisma.enrollment.count({
    where: {
      programId: program.id,
      ...(intake ? { intakeId: intake.id } : {}),
      userId: { not: userId },
      status: { in: ["PENDING", "ACTIVE", "COMPLETED"] },
    },
  });
  return reservedSeats >= capacity
    ? "This course has reached its enrollment capacity."
    : null;
}

type EnrollmentIntake = {
  id: string;
  applicationOpen: Date | null;
  applicationClose: Date | null;
  capacity: number | null;
};

function selectEnrollmentIntake(
  intakes: EnrollmentIntake[],
  intakeId?: string,
): { ok: true; intake: EnrollmentIntake | null } | { ok: false; error: string } {
  const intake = intakeId
    ? intakes.find((candidate) => candidate.id === intakeId)
    : intakes[0] ?? null;
  if (intakeId && !intake) {
    return { ok: false, error: "Selected intake is unavailable." };
  }
  if (!intake) return { ok: true, intake: null };
  const now = Date.now();
  if (intake.applicationOpen && intake.applicationOpen.getTime() > now) {
    return { ok: false, error: "Enrollment for this intake is not open yet." };
  }
  if (intake.applicationClose && intake.applicationClose.getTime() < now) {
    return { ok: false, error: "Enrollment for this intake is closed." };
  }
  return { ok: true, intake };
}

/** Activate (or create) an ACTIVE enrollment without payment — or PENDING if CRM must confirm. */
export async function enrollFree(programSlug: string, intakeId?: string) {
  const session = await requireStudent();

  const program = await prisma.program.findFirst({
    where: {
      organizationId: session.user.organizationId,
      slug: programSlug,
      status: "PUBLISHED",
    },
    include: {
      intakes: {
        where: { isActive: true },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!program) return { error: "Course not found." };
  if (program.formDefinitionId) {
    return {
      error:
        "This course requires an application and admissions approval before enrollment.",
    };
  }
  if (!isFreeCourse(program)) {
    return { error: "This course requires payment. Continue to payment." };
  }
  const intakeResult = selectEnrollmentIntake(program.intakes, intakeId);
  if (!intakeResult.ok) return { error: intakeResult.error };
  const selectedIntake = intakeResult.intake;

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: session.user.id, programId: program.id },
    },
  });

  if (existing?.status === "ACTIVE") {
    return {
      ok: true as const,
      alreadyEnrolled: true as const,
      awaitingCrm: false as const,
      enrollmentId: existing.id,
      programId: program.id,
    };
  }

  if (existing?.status === "PENDING" && program.requiresCrmCallback) {
    return {
      ok: true as const,
      alreadyEnrolled: false as const,
      awaitingCrm: true as const,
      enrollmentId: existing.id,
      programId: program.id,
    };
  }

  const capacityError = await programCapacityError(
    program,
    session.user.id,
    selectedIntake,
  );
  if (capacityError) return { error: capacityError };

  if (program.requiresCrmCallback) {
    const enrollment = existing
      ? await prisma.enrollment.update({
          where: { id: existing.id },
          data: {
            status: "PENDING",
            enrolledAt: null,
            crmRequestedAt: null,
            crmCallbackAt: null,
            intakeId: selectedIntake?.id ?? null,
          },
        })
      : await prisma.enrollment.create({
          data: {
            organizationId: program.organizationId,
            programId: program.id,
            intakeId: selectedIntake?.id ?? null,
            userId: session.user.id,
            status: "PENDING",
          },
        });

    await requestCrmEnrollmentCallback({
      enrollmentId: enrollment.id,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      program,
    });

    revalidateEnrollmentPaths(program.id);
    return {
      ok: true as const,
      alreadyEnrolled: false as const,
      awaitingCrm: true as const,
      enrollmentId: enrollment.id,
      programId: program.id,
    };
  }

  const enrollment = existing
    ? await prisma.enrollment.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          enrolledAt: new Date(),
          intakeId: selectedIntake?.id ?? null,
        },
      })
    : await prisma.enrollment.create({
        data: {
          organizationId: program.organizationId,
          programId: program.id,
          intakeId: selectedIntake?.id ?? null,
          userId: session.user.id,
          status: "ACTIVE",
          enrolledAt: new Date(),
        },
      });

  await notifyEnrollment(session.user.id, program);
  revalidateEnrollmentPaths(program.id);

  return {
    ok: true as const,
    alreadyEnrolled: false as const,
    awaitingCrm: false as const,
    enrollmentId: enrollment.id,
    programId: program.id,
  };
}

export async function startCheckout(
  programSlug: string,
  couponCode?: string,
  intakeId?: string,
) {
  const session = await requireStudent();

  const program = await prisma.program.findFirst({
    where: {
      organizationId: session.user.organizationId,
      slug: programSlug,
      status: "PUBLISHED",
    },
    include: {
      intakes: {
        where: { isActive: true },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!program) return { error: "Course not found." };
  if (program.formDefinitionId) {
    return {
      error:
        "This course requires an application and admissions approval before checkout.",
    };
  }

  if (isFreeCourse(program)) {
    return enrollFree(programSlug, intakeId);
  }
  const intakeResult = selectEnrollmentIntake(program.intakes, intakeId);
  if (!intakeResult.ok) return { error: intakeResult.error };
  const selectedIntake = intakeResult.intake;

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: session.user.id, programId: program.id },
    },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (existing?.status === "ACTIVE") {
    return {
      ok: true as const,
      alreadyEnrolled: true as const,
      enrollmentId: existing.id,
      programId: program.id,
      programSlug: program.slug,
      programName: program.title,
    };
  }

  const capacityError = await programCapacityError(
    program,
    session.user.id,
    selectedIntake,
  );
  if (capacityError) return { error: capacityError };

  const quote = await buildCourseQuote({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    program,
    couponCode,
  });
  if ("error" in quote) return quote;

  const paymentConfig = getPaymentConfig();
  const paymentSettings = await prisma.paymentSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  });
  if (
    paymentConfig.adapter === "razorpay" &&
    paymentSettings &&
    !paymentSettings.razorpayEnabled
  ) {
    return { error: "Razorpay is disabled for this organization." };
  }

  const amount = quote.totalAmount;
  const currency = quote.currency.trim().toUpperCase() || "INR";

  const enrollment =
    existing ??
    (await prisma.enrollment.create({
      data: {
        organizationId: program.organizationId,
        programId: program.id,
        intakeId: selectedIntake?.id ?? null,
        userId: session.user.id,
        status: "PENDING",
      },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    }));

  if (enrollment.status === "CANCELLED") {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "PENDING",
        enrolledAt: null,
        intakeId: selectedIntake?.id ?? null,
      },
    });
  } else if (
    enrollment.status === "PENDING" &&
    enrollment.intakeId !== (selectedIntake?.id ?? null)
  ) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { intakeId: selectedIntake?.id ?? null },
    });
  }

  const payments =
    "payments" in enrollment && Array.isArray(enrollment.payments)
      ? enrollment.payments
      : await prisma.payment.findMany({
          where: { enrollmentId: enrollment.id },
          orderBy: { createdAt: "desc" },
        });

  const existingPaid = payments.find((p) => p.status === "PAID");
  if (existingPaid) {
    const result = await completeCoursePayment({
      paymentId: existingPaid.id,
      note: "Activating enrollment from paid course fee",
    });
    if ("error" in result && result.error) return { error: result.error };
    revalidateEnrollmentPaths(program.id);
    return {
      ok: true as const,
      alreadyEnrolled: true as const,
      enrollmentId: enrollment.id,
      programId: program.id,
      programSlug: program.slug,
      programName: program.title,
    };
  }

  if (amount === 0) {
    const zeroPayment = await prisma.payment.create({
      data: {
        organizationId: program.organizationId,
        enrollmentId: enrollment.id,
        userId: session.user.id,
        programId: program.id,
        amount: 0,
        currency,
        status: "PENDING",
        provider: "OFFLINE",
        purpose: "COURSE_FEE",
        principalAmount: quote.principalAmount,
        discountAmount: quote.discountAmount,
        gstAmount: quote.gstAmount,
        convenienceFee: quote.convenienceFee,
        totalAmount: 0,
        couponCode: quote.couponCode,
        metadataJson: JSON.stringify({
          reason: "Fully discounted course checkout",
          offerId: quote.offerId,
        }),
      },
    });
    const result = await completeCoursePayment({
      paymentId: zeroPayment.id,
      providerPaymentId: `discount_${zeroPayment.id}`,
      note: "Course fee fully covered by discount",
    });
    if ("error" in result && result.error) return { error: result.error };
    revalidateEnrollmentPaths(program.id);
    return {
      ok: true as const,
      alreadyEnrolled: !result.awaitingCrm,
      awaitingCrm: result.awaitingCrm,
      enrollmentId: enrollment.id,
      programId: program.id,
      programSlug: program.slug,
      programName: program.title,
    };
  }

  try {
    const adapter = getPaymentAdapter();
    const open = payments.find(
      (p) =>
        (p.status === "CREATED" || p.status === "PENDING") &&
        p.amount === amount &&
        p.couponCode === quote.couponCode &&
        p.providerOrderId,
    );

    if (open?.providerOrderId) {
      return {
        ok: true as const,
        alreadyEnrolled: false as const,
        paymentId: open.id,
        enrollmentId: enrollment.id,
        programId: program.id,
        programSlug: program.slug,
        programName: program.title,
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
        studentName: session.user.name,
        studentEmail: session.user.email,
      };
    }

    const order = await adapter.createOrder({
      amount,
      currency,
      receipt: `enr_${enrollment.id.slice(0, 20)}`,
      notes: {
        enrollmentId: enrollment.id,
        programId: program.id,
        purpose: "COURSE_FEE",
        couponCode: quote.couponCode ?? "",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        organizationId: program.organizationId,
        enrollmentId: enrollment.id,
        amount: order.amount,
        currency: order.currency,
        status: "PENDING",
        provider: providerEnum(adapter.provider),
        purpose: "COURSE_FEE",
        providerOrderId: order.providerOrderId,
        userId: session.user.id,
        programId: program.id,
        principalAmount: quote.principalAmount,
        discountAmount: quote.discountAmount,
        gstAmount: quote.gstAmount,
        convenienceFee: quote.convenienceFee,
        totalAmount: quote.totalAmount,
        couponCode: quote.couponCode,
        metadataJson: JSON.stringify({ checkout: order.checkout }),
      },
    });

    return {
      ok: true as const,
      alreadyEnrolled: false as const,
      paymentId: payment.id,
      enrollmentId: enrollment.id,
      programId: program.id,
      programSlug: program.slug,
      programName: program.title,
      provider: adapter.provider,
      providerOrderId: order.providerOrderId,
      amount: order.amount,
      currency: order.currency,
      checkoutKey: order.checkoutKey,
      checkout: order.checkout,
      studentName: session.user.name,
      studentEmail: session.user.email,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not start checkout.",
    };
  }
}

export async function completeMockCoursePayment(paymentId: string) {
  if (!isMockPaymentsAllowed()) {
    return { error: "Mock payments are disabled in this environment." };
  }
  if (getPaymentConfig().adapter !== "mock") {
    return { error: "Mock checkout is not active." };
  }

  const session = await requireStudent();
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      purpose: "COURSE_FEE",
      provider: "MOCK",
      enrollment: { userId: session.user.id },
    },
    include: { enrollment: true },
  });
  if (!payment?.enrollment) return { error: "Mock payment not found." };
  if (payment.status === "PAID") {
    return {
      ok: true as const,
      enrollmentId: payment.enrollmentId!,
      programId: payment.enrollment.programId,
    };
  }

  const result = await completeCoursePayment({
    paymentId: payment.id,
    providerPaymentId: `mock_pay_${Date.now()}`,
    providerSignature: "mock",
    note: "Course fee paid (mock checkout)",
  });
  if ("error" in result && result.error) return { error: result.error };

  revalidateEnrollmentPaths(payment.enrollment.programId);
  return {
    ok: true as const,
    awaitingCrm: "awaitingCrm" in result ? Boolean(result.awaitingCrm) : false,
    enrollmentId: result.enrollmentId,
    programId: result.programId,
  };
}

export async function verifyCoursePayment(input: {
  paymentId: string;
  providerPaymentId: string;
  providerSignature: string;
}) {
  const session = await requireStudent();
  const payment = await prisma.payment.findFirst({
    where: {
      id: input.paymentId,
      purpose: "COURSE_FEE",
      enrollment: { userId: session.user.id },
    },
    include: { enrollment: true },
  });
  if (!payment?.enrollment) return { error: "Payment not found." };
  if (payment.status === "PAID") {
    return {
      ok: true as const,
      alreadyPaid: true,
      enrollmentId: payment.enrollmentId!,
      programId: payment.enrollment.programId,
    };
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

    const result = await completeCoursePayment({
      paymentId: payment.id,
      providerPaymentId: input.providerPaymentId,
      providerSignature: input.providerSignature,
      note: `Course fee paid via ${adapter.provider}`,
    });
    if ("error" in result && result.error) return { error: result.error };

    revalidateEnrollmentPaths(payment.enrollment.programId);
    return {
      ok: true as const,
      alreadyPaid: result.alreadyPaid,
      awaitingCrm: "awaitingCrm" in result ? Boolean(result.awaitingCrm) : false,
      enrollmentId: result.enrollmentId,
      programId: result.programId,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Payment verification failed.",
    };
  }
}

export async function failCoursePayment(paymentId: string, reason?: string) {
  const session = await requireStudent();
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      purpose: "COURSE_FEE",
      enrollment: { userId: session.user.id },
    },
    include: { enrollment: { include: { program: { select: { slug: true } } } } },
  });
  if (!payment?.enrollment) return { error: "Payment not found." };

  await markPaymentFailed({
    paymentId: payment.id,
    reason: reason ?? "Payment failed",
  });

  return {
    ok: true as const,
    programSlug: payment.enrollment.program.slug,
  };
}

export async function updateStudentProfile(name: string) {
  const session = await requireStudent();
  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Name must be at least 2 characters." };
  if (trimmed.length > 80) return { error: "Name is too long." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: trimmed },
  });

  revalidatePath("/student/profile");
  revalidatePath("/student/settings");
  revalidatePath("/student/dashboard");
  return { ok: true as const };
}

export async function changeStudentPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await requireStudent();
  const bcrypt = await import("bcryptjs");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "User not found." };

  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) return { error: "Current password is incorrect." };
  if (input.newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const password = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password },
  });

  return { ok: true as const };
}
