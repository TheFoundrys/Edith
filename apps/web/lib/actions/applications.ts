"use server";

import { revalidatePath } from "next/cache";
import { ApplicationStatus } from "@prisma/client";
import { requireSession, requireCapability } from "@/lib/auth/session";
import { crmSyncStatusSafe, crmUpsertLeadSafe } from "@/lib/crm";
import { prisma } from "@/lib/db";
import { parseFormSchema, validateAnswers } from "@/lib/forms/schema";
import { saveApplicationDocument } from "@/lib/storage";
import { canTransition } from "@/lib/workflows/status";

export async function startApplication(programId: string, intakeId?: string) {
  const session = await requireSession();

  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      organizationId: session.user.organizationId,
      status: "PUBLISHED",
    },
    include: {
      formDefinition: {
        include: {
          versions: {
            where: { isPublished: true },
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      },
      intakes: { where: { isActive: true } },
    },
  });

  if (!program?.formDefinition?.versions[0]) {
    return { error: "This program is not open for applications." };
  }

  const existing = await prisma.application.findFirst({
    where: {
      applicantId: session.user.id,
      programId,
      status: { not: "REJECTED" },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status === "DRAFT") {
    return { ok: true as const, id: existing.id };
  }
  if (existing && existing.status !== "DRAFT") {
    return { ok: true as const, id: existing.id };
  }

  const resolvedIntake =
    intakeId ||
    program.intakes[0]?.id ||
    null;

  const application = await prisma.application.create({
    data: {
      organizationId: session.user.organizationId,
      programId,
      intakeId: resolvedIntake,
      applicantId: session.user.id,
      formVersionId: program.formDefinition.versions[0].id,
      status: "DRAFT",
      answersJson: JSON.stringify({
        full_name: session.user.name,
        email: session.user.email,
      }),
      events: {
        create: {
          toStatus: "DRAFT",
          note: "Application started",
          actorId: session.user.id,
        },
      },
    },
  });

  revalidatePath("/student/applications");
  return { ok: true as const, id: application.id };
}

export async function saveApplicationAnswers(
  applicationId: string,
  answers: Record<string, unknown>,
) {
  const session = await requireSession();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, applicantId: session.user.id },
  });
  if (!application) return { error: "Application not found." };
  if (application.status !== "DRAFT") {
    return { error: "Submitted applications cannot be edited." };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { answersJson: JSON.stringify(answers) },
  });

  revalidatePath(`/student/applications/${applicationId}`);
  return { ok: true as const };
}

export async function uploadApplicationDocument(
  applicationId: string,
  fieldKey: string,
  formData: FormData,
) {
  const session = await requireSession();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, applicantId: session.user.id },
  });
  if (!application) return { error: "Application not found." };
  if (application.status !== "DRAFT") {
    return { error: "Submitted applications cannot be edited." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const stored = await saveApplicationDocument(file);
  if ("error" in stored) return { error: stored.error };

  await prisma.document.deleteMany({
    where: { applicationId, fieldKey },
  });
  await prisma.document.create({
    data: {
      applicationId,
      fieldKey,
      fileName: stored.fileName,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      storagePath: stored.storagePath,
      uploadedById: session.user.id,
    },
  });

  const answers = JSON.parse(application.answersJson) as Record<string, unknown>;
  answers[fieldKey] = stored.fileName;
  await prisma.application.update({
    where: { id: applicationId },
    data: { answersJson: JSON.stringify(answers) },
  });

  revalidatePath(`/student/applications/${applicationId}`);
  return { ok: true as const };
}

export async function submitApplication(applicationId: string) {
  const session = await requireSession();
  const application = await prisma.application.findFirst({
    where: { id: applicationId, applicantId: session.user.id },
    include: {
      formVersion: true,
      program: true,
      intake: true,
      documents: true,
      applicant: true,
    },
  });
  if (!application) return { error: "Application not found." };
  if (application.status !== "DRAFT") return { error: "Already submitted." };

  const schema = parseFormSchema(application.formVersion.schemaJson);
  const answers = JSON.parse(application.answersJson) as Record<string, unknown>;

  for (const doc of application.documents) {
    answers[doc.fieldKey] = doc.fileName;
  }

  const validation = validateAnswers(schema, answers);
  if (!validation.ok) {
    return { error: "Please complete all required fields.", fieldErrors: validation.errors };
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      answersJson: JSON.stringify(answers),
      events: {
        create: {
          fromStatus: "DRAFT",
          toStatus: "SUBMITTED",
          note: "Application submitted",
          actorId: session.user.id,
        },
      },
    },
  });

  const lead = await crmUpsertLeadSafe({
    organizationId: application.organizationId,
    applicationId: application.id,
    email: String(answers.email || application.applicant.email),
    name: String(answers.full_name || application.applicant.name),
    phone: answers.phone ? String(answers.phone) : undefined,
    programName: application.program.title,
    programId: application.programId,
    crmCatalogId: application.program.crmCatalogId,
    intakeName: application.intake?.name,
    status: "SUBMITTED",
    answers,
  });

  if (lead) {
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        crmLeadId: lead.externalLeadId,
        crmApplicationId: lead.externalApplicationId ?? null,
      },
    });
  }

  revalidatePath(`/student/applications/${applicationId}`);
  revalidatePath("/student/applications");
  revalidatePath("/admin/applications");
  return { ok: true as const, id: updated.id };
}

export async function transitionApplicationStatus(
  applicationId: string,
  toStatus: ApplicationStatus,
  note?: string,
) {
  const session = await requireCapability("manageApplications");
  const application = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: session.user.organizationId },
  });
  if (!application) return { error: "Application not found." };

  if (!canTransition(application.status, toStatus)) {
    return { error: `Cannot move from ${application.status} to ${toStatus}.` };
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: toStatus,
      events: {
        create: {
          fromStatus: application.status,
          toStatus,
          note: note || null,
          actorId: session.user.id,
        },
      },
    },
  });

  await crmSyncStatusSafe({
    organizationId: application.organizationId,
    applicationId: application.id,
    externalLeadId: application.crmLeadId,
    externalApplicationId: application.crmApplicationId,
    status: toStatus,
    note,
  });

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/admin/applications");
  revalidatePath(`/student/applications/${applicationId}`);
  return { ok: true as const };
}

export async function setDocumentVerification(
  documentId: string,
  verified: boolean,
) {
  const session = await requireCapability("manageApplications");
  const doc = await prisma.document.findFirst({
    where: {
      id: documentId,
      application: { organizationId: session.user.organizationId },
    },
  });
  if (!doc) return { error: "Document not found." };

  await prisma.document.update({
    where: { id: documentId },
    data: verified
      ? { verifiedAt: new Date(), verifiedById: session.user.id }
      : { verifiedAt: null, verifiedById: null },
  });

  revalidatePath(`/admin/applications/${doc.applicationId}`);
  return { ok: true as const };
}
