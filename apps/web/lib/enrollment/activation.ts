import "server-only";

import type { EnrollmentStatus, Prisma } from "@prisma/client";

export async function upsertEnrollmentAccess(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    programId: string;
    userId: string;
    intakeId?: string | null;
    status: Extract<EnrollmentStatus, "ACTIVE" | "PENDING">;
    amountPaid?: number;
  },
) {
  const active = input.status === "ACTIVE";
  return tx.enrollment.upsert({
    where: {
      userId_programId: {
        userId: input.userId,
        programId: input.programId,
      },
    },
    create: {
      organizationId: input.organizationId,
      programId: input.programId,
      intakeId: input.intakeId ?? null,
      userId: input.userId,
      status: input.status,
      enrolledAt: active ? new Date() : null,
      amountPaid: input.amountPaid ?? 0,
    },
    update: {
      organizationId: input.organizationId,
      ...(input.intakeId !== undefined ? { intakeId: input.intakeId } : {}),
      status: input.status,
      enrolledAt: active ? new Date() : null,
      ...(input.amountPaid != null ? { amountPaid: input.amountPaid } : {}),
      ...(active
        ? { crmCallbackAt: new Date() }
        : {}),
    },
  });
}
