import { crmUpsertLeadSafe } from "@/lib/crm";
import { prisma } from "@/lib/db";

/**
 * For courses with requiresCrmCallback: keep enrollment PENDING,
 * notify CentraCRM, and wait for POST /api/crm/enrollment-callback.
 */
export async function requestCrmEnrollmentCallback(opts: {
  enrollmentId: string;
  user: { id: string; name: string; email: string };
  program: {
    id: string;
    name: string;
    organizationId: string;
    crmCatalogId: string | null;
    requiresCrmCallback: boolean;
  };
}) {
  if (!opts.program.requiresCrmCallback) {
    return { awaitingCrm: false as const };
  }

  const lead = await crmUpsertLeadSafe({
    organizationId: opts.program.organizationId,
    enrollmentId: opts.enrollmentId,
    email: opts.user.email,
    name: opts.user.name,
    programId: opts.program.id,
    programName: opts.program.name,
    crmCatalogId: opts.program.crmCatalogId,
    status: "PENDING",
  });

  await prisma.enrollment.update({
    where: { id: opts.enrollmentId },
    data: {
      status: "PENDING",
      enrolledAt: null,
      crmLeadId: lead?.externalLeadId ?? undefined,
      crmRequestedAt: new Date(),
      crmCallbackAt: null,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opts.user.id,
      title: "Enrollment pending confirmation",
      body: `${opts.program.name} needs CRM confirmation before learning unlocks.`,
      href: `/student/my-courses/${opts.program.id}`,
    },
  });

  return {
    awaitingCrm: true as const,
    crmLeadId: lead?.externalLeadId ?? null,
  };
}

export async function activateEnrollmentFromCrm(opts: {
  enrollmentId: string;
  leadId?: string | null;
  note?: string;
}) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: opts.enrollmentId },
    include: { program: { select: { id: true, name: true } } },
  });
  if (!enrollment) return { error: "Enrollment not found." as const };
  if (enrollment.status === "ACTIVE") {
    return {
      ok: true as const,
      alreadyActive: true as const,
      enrollmentId: enrollment.id,
      programId: enrollment.programId,
    };
  }
  if (enrollment.status === "CANCELLED") {
    return { error: "Enrollment was cancelled." as const };
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "ACTIVE",
      enrolledAt: new Date(),
      crmLeadId: opts.leadId ?? enrollment.crmLeadId,
      crmCallbackAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: enrollment.userId,
      title: "Enrollment confirmed",
      body: `${enrollment.program.name} is unlocked. Open the course to start learning.`,
      href: `/student/learning/${enrollment.programId}`,
    },
  });

  return {
    ok: true as const,
    alreadyActive: false as const,
    enrollmentId: enrollment.id,
    programId: enrollment.programId,
  };
}

export async function rejectEnrollmentFromCrm(opts: {
  enrollmentId: string;
  leadId?: string | null;
  note?: string;
}) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: opts.enrollmentId },
    include: { program: { select: { id: true, name: true } } },
  });
  if (!enrollment) return { error: "Enrollment not found." as const };
  if (enrollment.status === "CANCELLED") {
    return { ok: true as const, alreadyCancelled: true as const };
  }

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: "CANCELLED",
      enrolledAt: null,
      crmLeadId: opts.leadId ?? enrollment.crmLeadId,
      crmCallbackAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: enrollment.userId,
      title: "Enrollment not confirmed",
      body:
        opts.note?.trim() ||
        `${enrollment.program.name} was not confirmed by CRM. Contact support if you need help.`,
      href: "/student/enroll",
    },
  });

  return { ok: true as const, alreadyCancelled: false as const };
}
