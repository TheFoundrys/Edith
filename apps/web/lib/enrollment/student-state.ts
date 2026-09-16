import { findCompassEnrollment } from "@/lib/compass/enrollment";
import { listCompassTransactionsForUser } from "@/lib/compass/transactions";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export type StudentCourseEnrollmentState =
  | { kind: "active"; enrollmentId: string; programId: string }
  | { kind: "pending_crm"; enrollmentId: string; programId: string }
  | { kind: "pending_payment"; enrollmentId: string; programId: string }
  | { kind: "none" };

export async function getStudentCourseEnrollmentState(
  userId: string,
  program: { id: string; requiresCrmCallback: boolean },
): Promise<StudentCourseEnrollmentState> {
  if (isCompassDatabase()) {
    const enrollment = await findCompassEnrollment(userId, program.id);
    if (!enrollment) return { kind: "none" };
    if (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED") {
      return {
        kind: "active",
        enrollmentId: enrollment.id,
        programId: program.id,
      };
    }
    if (enrollment.status !== "PENDING") return { kind: "none" };
    const payments = await listCompassTransactionsForUser(userId, program.id);
    const hasPaid = payments.some((p) =>
      ["PAID", "SUCCESS", "COMPLETED"].includes(p.status),
    );
    if (!hasPaid) {
      return {
        kind: "pending_payment",
        enrollmentId: enrollment.id,
        programId: program.id,
      };
    }
    return { kind: "none" };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId, programId: program.id },
    },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { status: true },
      },
    },
  });

  if (!enrollment) return { kind: "none" };

  if (enrollment.status === "ACTIVE" || enrollment.status === "COMPLETED") {
    return {
      kind: "active",
      enrollmentId: enrollment.id,
      programId: program.id,
    };
  }

  if (enrollment.status !== "PENDING") {
    return { kind: "none" };
  }

  if (program.requiresCrmCallback) {
    return {
      kind: "pending_crm",
      enrollmentId: enrollment.id,
      programId: program.id,
    };
  }

  const hasPaid = enrollment.payments.some((payment) => payment.status === "PAID");
  if (!hasPaid) {
    return {
      kind: "pending_payment",
      enrollmentId: enrollment.id,
      programId: program.id,
    };
  }

  return { kind: "none" };
}
