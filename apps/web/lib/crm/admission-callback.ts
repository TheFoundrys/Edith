import { revalidatePath } from "next/cache";
import { upsertEnrollmentAccess } from "@/lib/enrollment/activation";
import { requiresApplication } from "@/lib/enrollment/admissions";
import { afterEnrollmentHref } from "@/lib/assessments/personality-profile";
import { prisma } from "@/lib/db";

function revalidateAdmissionPaths(programId: string) {
  revalidatePath("/student/dashboard");
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath("/student/enroll");
  revalidatePath("/student/transactions");
  revalidatePath("/courses");
}

async function resolvePublishedFormVersion(formDefinitionId: string) {
  return prisma.formVersion.findFirst({
    where: { formDefinitionId, isPublished: true },
    orderBy: { version: "desc" },
    select: { id: true },
  });
}

async function syncApplicationRecord(opts: {
  organizationId: string;
  programId: string;
  userId: string;
  formVersionId: string;
  intakeId?: string | null;
  crmApplicationId?: string | null;
  crmLeadId?: string | null;
  status: "ENROLLED" | "REJECTED";
  note?: string;
}) {
  const existing = await prisma.application.findFirst({
    where: {
      applicantId: opts.userId,
      programId: opts.programId,
      status: { not: "REJECTED" },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    if (existing.status === opts.status) return existing;
    const fromStatus = existing.status;
    await prisma.application.update({
      where: { id: existing.id },
      data: {
        status: opts.status,
        intakeId: opts.intakeId ?? existing.intakeId,
        crmApplicationId: opts.crmApplicationId ?? existing.crmApplicationId,
        crmLeadId: opts.crmLeadId ?? existing.crmLeadId,
        submittedAt: existing.submittedAt ?? new Date(),
        events: {
          create: {
            fromStatus,
            toStatus: opts.status,
            note: opts.note?.trim() || "CRM admission callback",
          },
        },
      },
    });
    return existing;
  }

  return prisma.application.create({
    data: {
      organizationId: opts.organizationId,
      programId: opts.programId,
      intakeId: opts.intakeId ?? null,
      applicantId: opts.userId,
      formVersionId: opts.formVersionId,
      status: opts.status,
      answersJson: "{}",
      crmApplicationId: opts.crmApplicationId ?? null,
      crmLeadId: opts.crmLeadId ?? null,
      submittedAt: new Date(),
      events: {
        create: {
          fromStatus: "DRAFT",
          toStatus: opts.status,
          note: opts.note?.trim() || "CRM admission callback",
        },
      },
    },
  });
}

/**
 * CentraCRM admission approval → Edith LMS enrollment.
 * Degree programmes apply in CRM only; learning unlocks here after admission.
 */
export async function activateAdmissionFromCrm(opts: {
  email: string;
  programSlug: string;
  crmApplicationId?: string | null;
  crmLeadId?: string | null;
  intakeId?: string | null;
  note?: string;
}) {
  const email = opts.email.trim().toLowerCase();
  const programSlug = opts.programSlug.trim();
  if (!email) return { error: "email is required." as const };
  if (!programSlug) return { error: "programSlug is required." as const };

  const program = await prisma.program.findFirst({
    where: { slug: programSlug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      organizationId: true,
      formDefinitionId: true,
      domainSlug: true,
      sku: true,
    },
  });
  if (!program) return { error: "Program not found." as const };
  if (!requiresApplication(program)) {
    return {
      error:
        "This program does not require CRM admission. Use direct enrollment instead." as const,
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      memberships: { some: { organizationId: program.organizationId } },
    },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return {
      error:
        "No Edith account found for this email. The student must register in Edith before CRM can unlock LMS access." as const,
    };
  }

  if (opts.intakeId) {
    const intake = await prisma.intake.findFirst({
      where: {
        id: opts.intakeId,
        programId: program.id,
        isActive: true,
      },
      select: { id: true },
    });
    if (!intake) return { error: "intakeId is invalid for this program." as const };
  }

  const existing = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: user.id, programId: program.id },
    },
  });
  if (existing?.status === "ACTIVE") {
    return {
      ok: true as const,
      alreadyActive: true as const,
      enrollmentId: existing.id,
      programId: program.id,
      userId: user.id,
    };
  }

  const formVersion = program.formDefinitionId
    ? await resolvePublishedFormVersion(program.formDefinitionId)
    : null;

  const enrollment = await prisma.$transaction(async (tx) => {
    const record = await upsertEnrollmentAccess(tx, {
      organizationId: program.organizationId,
      programId: program.id,
      userId: user.id,
      intakeId: opts.intakeId ?? existing?.intakeId ?? null,
      status: "ACTIVE",
    });

    await tx.enrollment.update({
      where: { id: record.id },
      data: {
        crmLeadId: opts.crmLeadId ?? opts.crmApplicationId ?? existing?.crmLeadId,
        crmCallbackAt: new Date(),
      },
    });

    return record;
  });

  if (formVersion) {
    await syncApplicationRecord({
      organizationId: program.organizationId,
      programId: program.id,
      userId: user.id,
      formVersionId: formVersion.id,
      intakeId: opts.intakeId ?? existing?.intakeId ?? null,
      crmApplicationId: opts.crmApplicationId,
      crmLeadId: opts.crmLeadId,
      status: "ENROLLED",
      note: opts.note,
    });
  }

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Admission confirmed — LMS unlocked",
      message: `${program.title} is now available in My Learning. Open the course to start.`,
      actionUrl: afterEnrollmentHref(program),
    },
  });

  revalidateAdmissionPaths(program.id);

  return {
    ok: true as const,
    alreadyActive: false as const,
    enrollmentId: enrollment.id,
    programId: program.id,
    userId: user.id,
  };
}

export async function rejectAdmissionFromCrm(opts: {
  email: string;
  programSlug: string;
  crmApplicationId?: string | null;
  note?: string;
}) {
  const email = opts.email.trim().toLowerCase();
  const programSlug = opts.programSlug.trim();
  if (!email) return { error: "email is required." as const };
  if (!programSlug) return { error: "programSlug is required." as const };

  const program = await prisma.program.findFirst({
    where: { slug: programSlug, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      organizationId: true,
      formDefinitionId: true,
    },
  });
  if (!program) return { error: "Program not found." as const };
  if (!requiresApplication(program)) {
    return { error: "This program does not use CRM admission." as const };
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
      memberships: { some: { organizationId: program.organizationId } },
    },
    select: { id: true },
  });
  if (!user) {
    return { ok: true as const, noop: true as const, reason: "user_not_found" as const };
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: user.id, programId: program.id },
    },
  });

  const paidPayment = enrollment
    ? await prisma.payment.findFirst({
        where: {
          status: "PAID",
          OR: [
            { enrollmentId: enrollment.id },
            {
              application: {
                applicantId: user.id,
                programId: program.id,
              },
            },
          ],
        },
        select: { id: true },
      })
    : null;

  if (paidPayment) {
    return {
      error:
        "Cannot reject admission while a paid fee exists. Refund first." as const,
    };
  }

  const formVersion = program.formDefinitionId
    ? await resolvePublishedFormVersion(program.formDefinitionId)
    : null;

  await prisma.$transaction(async (tx) => {
    if (enrollment && enrollment.status !== "CANCELLED") {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "CANCELLED",
          enrolledAt: null,
          crmCallbackAt: new Date(),
        },
      });
    }

    if (formVersion) {
      await syncApplicationRecord({
        organizationId: program.organizationId,
        programId: program.id,
        userId: user.id,
        formVersionId: formVersion.id,
        crmApplicationId: opts.crmApplicationId,
        status: "REJECTED",
        note: opts.note,
      });
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Application update",
      message:
        opts.note?.trim() ||
        `Your application for ${program.title} was not approved. Contact admissions if you have questions.`,
      actionUrl: "/student/applications",
    },
  });

  return { ok: true as const, noop: false as const };
}
