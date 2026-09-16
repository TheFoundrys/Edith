import "server-only";

import { revalidatePath } from "next/cache";
import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPaymentAdapter, getPaymentConfig, isMockPaymentsAllowed } from "@/lib/payments";
import { buildCompassCourseQuote } from "@/lib/payments/quote";
import { isFreeCourse } from "@/lib/programs/pricing";
import { resolvePublishedProgramBySlug } from "@/lib/compass/program-bridge";
import {
  activateCompassEnrollment,
  findCompassEnrollment,
  upsertCompassEnrollmentActive,
  upsertCompassEnrollmentPending,
} from "@/lib/compass/enrollment";
import { hasCompassPaidCourseAccess } from "@/lib/compass/transactions";
import { afterEnrollmentHref } from "@/lib/assessments/personality-profile";

function revalidateEnrollmentPaths(programId: string) {
  revalidatePath("/student/dashboard");
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath("/student/learning");
  revalidatePath(`/student/learning/${programId}`);
  revalidatePath("/student/transactions");
  revalidatePath("/checkout");
  revalidatePath("/courses");
}

async function notifyCompassEnrollment(userId: string, program: { id: string; title: string; slug: string }) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title: "Enrollment confirmed",
        message: `You're enrolled in ${program.title}. Open the course to start learning.`,
        actionUrl: afterEnrollmentHref(program),
      },
    });
  } catch {
    // Notification table may differ on legacy DB — non-fatal.
  }
}

export async function compassEnrollFree(
  session: SessionUser,
  programSlug: string,
) {
  const program = await resolvePublishedProgramBySlug(
    programSlug,
    session.organizationId,
  );
  if (!program || program.status !== "PUBLISHED") {
    return { error: "Course not found." };
  }
  if (!isFreeCourse(program)) {
    return { error: "This course requires payment. Continue to payment." };
  }

  const existing = await findCompassEnrollment(session.id, program.id);
  if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED") {
    return {
      ok: true as const,
      alreadyEnrolled: true as const,
      awaitingCrm: false as const,
      enrollmentId: existing.id,
      programId: program.id,
    };
  }

  const enrollment = await upsertCompassEnrollmentActive(session.id, program.id);
  await notifyCompassEnrollment(session.id, program);
  revalidateEnrollmentPaths(program.id);

  return {
    ok: true as const,
    alreadyEnrolled: false as const,
    awaitingCrm: false as const,
    enrollmentId: enrollment.id,
    programId: program.id,
  };
}

export async function compassStartCheckout(
  session: SessionUser,
  programSlug: string,
) {
  const program = await resolvePublishedProgramBySlug(
    programSlug,
    session.organizationId,
  );
  if (!program || program.status !== "PUBLISHED") {
    return { error: "Course not found." };
  }

  if (isFreeCourse(program)) {
    return compassEnrollFree(session, programSlug);
  }

  const existing = await findCompassEnrollment(session.id, program.id);
  if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED") {
    return {
      ok: true as const,
      alreadyEnrolled: true as const,
      enrollmentId: existing.id,
      programId: program.id,
      programSlug: program.slug,
      programName: program.title,
    };
  }

  const paid = await hasCompassPaidCourseAccess(session.id, program.id);
  if (paid) {
    const enrollment = await upsertCompassEnrollmentActive(session.id, program.id);
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

  const quote = buildCompassCourseQuote(program);
  const enrollment = await upsertCompassEnrollmentPending(session.id, program.id);

  if (quote.totalAmount === 0) {
    await activateCompassEnrollment(enrollment.id);
    await notifyCompassEnrollment(session.id, program);
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

  const paymentConfig = getPaymentConfig();
  if (!isMockPaymentsAllowed() && paymentConfig.adapter === "mock") {
    return {
      error:
        "Online checkout is not configured for compass_dev. Enroll via Skill Compass or enable mock payments locally.",
    };
  }

  try {
    const adapter = getPaymentAdapter();
    const order = await adapter.createOrder({
      amount: quote.totalAmount,
      currency: quote.currency,
      receipt: `enr_${enrollment.id.slice(0, 20)}`,
      notes: {
        enrollmentId: enrollment.id,
        programId: program.id,
        purpose: "COURSE_FEE",
      },
    });

    revalidateEnrollmentPaths(program.id);
    return {
      ok: true as const,
      alreadyEnrolled: false as const,
      paymentId: enrollment.id,
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
      studentName: session.name,
      studentEmail: session.email,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not start checkout.",
    };
  }
}

export async function compassCompleteMockPayment(
  session: SessionUser,
  enrollmentId: string,
) {
  if (!isMockPaymentsAllowed()) {
    return { error: "Mock payments are disabled in this environment." };
  }

  const enrollment = await findCompassEnrollmentById(session.id, enrollmentId);
  if (!enrollment) return { error: "Enrollment not found." };

  await activateCompassEnrollment(enrollment.id);
  revalidateEnrollmentPaths(enrollment.programId);

  return {
    ok: true as const,
    awaitingCrm: false as const,
    enrollmentId: enrollment.id,
    programId: enrollment.programId,
  };
}

async function findCompassEnrollmentById(userId: string, enrollmentId: string) {
  const rows = await prisma.$queryRaw<
    { id: string; courseId: string | null; status: string }[]
  >`
    SELECT id, "courseId", status::text AS status
    FROM "Enrollment"
    WHERE id = ${enrollmentId} AND "userId" = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row?.courseId) return null;
  return { id: row.id, programId: row.courseId, status: row.status };
}
