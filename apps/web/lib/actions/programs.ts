"use server";

import { revalidatePath } from "next/cache";
import { CourseType, DegreeLevel, ProgramStatus } from "@prisma/client";
import { z } from "zod";
import { requireCapability, canUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  isContentProgram,
  PROGRAM_CATEGORIES,
} from "@/lib/programs/categories";
import { saveProgramImage } from "@/lib/storage";
import { slugify } from "@/lib/utils";

const categoryValues = PROGRAM_CATEGORIES.map((c) => c.value) as [
  (typeof PROGRAM_CATEGORIES)[number]["value"],
  ...(typeof PROGRAM_CATEGORIES)[number]["value"][],
];

const programSchema = z.object({
  name: z.string().min(2),
  category: z.enum(categoryValues),
  degreeLevel: z.nativeEnum(DegreeLevel).default(DegreeLevel.CERTIFICATE),
  summary: z.string().optional(),
  eligibilitySummary: z.string().optional(),
  price: z.coerce.number().optional().nullable(),
  tuitionCurrency: z.string().default("USD"),
  capacity: z.coerce.number().int().optional().nullable(),
  applicationFee: z.coerce.number().optional().nullable(),
  campusId: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  formDefinitionId: z.string().optional().nullable(),
  requiredDocs: z.string().optional(),
  crmCatalogId: z.string().optional().nullable(),
  requiresCrmCallback: z.boolean().optional().default(false),
  deliveryMode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).optional(),
});

function parseDocs(raw: string | undefined) {
  if (!raw) return "[]";
  const items = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(items);
}

function deliveryFields(mode: "ONLINE" | "OFFLINE" | "HYBRID" | undefined) {
  if (mode === "ONLINE") {
    return { type: CourseType.SELF_PACED, isHybridOnly: false };
  }
  if (mode === "OFFLINE") {
    return { type: CourseType.HYBRID, isHybridOnly: false };
  }
  if (mode === "HYBRID") {
    return { type: CourseType.HYBRID, isHybridOnly: true };
  }
  return {};
}

async function resolveImageUrl(
  formData: FormData,
  existingUrl?: string | null,
): Promise<{ imageUrl: string | null } | { error: string }> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const saved = await saveProgramImage(file);
    if ("error" in saved) return { error: saved.error };
    return { imageUrl: saved.imageUrl };
  }
  return { imageUrl: existingUrl ?? null };
}

export async function createProgram(formData: FormData) {
  const session = await requireCapability("managePrograms");
  const category = String(formData.get("category") || "");
  const settingPrice = String(formData.get("price") || formData.get("applicationFee") || "").trim();
  if (
    !canUser(session.user, "managePricing") &&
    (!isContentProgram(category) || settingPrice)
  ) {
    return { error: "You do not have permission to set program pricing." };
  }
  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    degreeLevel: formData.get("degreeLevel") || DegreeLevel.CERTIFICATE,
    summary: formData.get("summary") || undefined,
    eligibilitySummary: formData.get("eligibilitySummary") || undefined,
    price: formData.get("price") || null,
    tuitionCurrency: formData.get("tuitionCurrency") || "USD",
    capacity: formData.get("capacity") || null,
    applicationFee: formData.get("applicationFee") || null,
    campusId: formData.get("campusId") || null,
    departmentId: formData.get("departmentId") || null,
    formDefinitionId: formData.get("formDefinitionId") || null,
    requiredDocs: String(formData.get("requiredDocs") || ""),
    crmCatalogId: formData.get("crmCatalogId") || null,
    requiresCrmCallback: formData.get("requiresCrmCallback") === "on",
    deliveryMode: formData.get("deliveryMode") || undefined,
  });
  if (!parsed.success) return { error: "Invalid program details." };

  const contentCourse = isContentProgram(parsed.data.category);
  const image = await resolveImageUrl(formData);
  if ("error" in image) return { error: image.error };

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let i = 1;
  while (
    await prisma.program.findUnique({
      where: {
        organizationId_slug: {
          organizationId: session.user.organizationId,
          slug,
        },
      },
    })
  ) {
    slug = `${baseSlug}-${i++}`;
  }

  const program = await prisma.program.create({
    data: {
      organizationId: session.user.organizationId,
      title: parsed.data.name,
      slug,
      category: parsed.data.category,
      degreeLevel: contentCourse ? DegreeLevel.CERTIFICATE : parsed.data.degreeLevel,
      description: parsed.data.summary,
      eligibilitySummary: contentCourse ? null : parsed.data.eligibilitySummary,
      imageUrl: image.imageUrl,
      price: parsed.data.price,
      tuitionCurrency: parsed.data.tuitionCurrency,
      capacity: parsed.data.capacity,
      applicationFee: contentCourse ? null : parsed.data.applicationFee,
      campusId: contentCourse ? null : parsed.data.campusId || null,
      departmentId: parsed.data.departmentId || null,
      formDefinitionId: contentCourse ? null : parsed.data.formDefinitionId || null,
      requiredDocs: contentCourse ? "[]" : parseDocs(parsed.data.requiredDocs),
      crmCatalogId: contentCourse ? null : parsed.data.crmCatalogId || null,
      requiresCrmCallback: contentCourse
        ? false
        : (parsed.data.requiresCrmCallback ?? false),
      status: ProgramStatus.DRAFT,
      ...(contentCourse
        ? { type: CourseType.SELF_PACED, isHybridOnly: false }
        : deliveryFields(parsed.data.deliveryMode)),
    },
  });

  revalidatePath("/admin/programs");
  return { ok: true as const, id: program.id };
}

export async function updateProgram(programId: string, formData: FormData) {
  const session = await requireCapability("managePrograms");
  const existing = await prisma.program.findFirst({
    where: { id: programId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Program not found." };

  const allowPricing = canUser(session.user, "managePricing");

  const parsed = programSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    degreeLevel: formData.get("degreeLevel") || DegreeLevel.CERTIFICATE,
    summary: formData.get("summary") || undefined,
    eligibilitySummary: formData.get("eligibilitySummary") || undefined,
    price: allowPricing
      ? formData.get("price") || null
      : existing.price,
    tuitionCurrency: allowPricing
      ? formData.get("tuitionCurrency") || "USD"
      : existing.tuitionCurrency,
    capacity: formData.get("capacity") || null,
    applicationFee: allowPricing
      ? formData.get("applicationFee") || null
      : existing.applicationFee,
    campusId: formData.get("campusId") || null,
    departmentId: formData.get("departmentId") || null,
    formDefinitionId: formData.get("formDefinitionId") || null,
    requiredDocs: String(formData.get("requiredDocs") || ""),
    crmCatalogId: formData.get("crmCatalogId") || null,
    requiresCrmCallback: formData.get("requiresCrmCallback") === "on",
    deliveryMode: formData.get("deliveryMode") || undefined,
  });
  if (!parsed.success) return { error: "Invalid program details." };

  const contentCourse = isContentProgram(parsed.data.category);
  const image = await resolveImageUrl(formData, existing.imageUrl);
  if ("error" in image) return { error: image.error };

  await prisma.program.update({
    where: { id: programId },
    data: {
      title: parsed.data.name,
      category: parsed.data.category,
      degreeLevel: contentCourse
        ? DegreeLevel.CERTIFICATE
        : parsed.data.degreeLevel,
      description: parsed.data.summary,
      eligibilitySummary: contentCourse
        ? existing.eligibilitySummary
        : parsed.data.eligibilitySummary,
      imageUrl: image.imageUrl,
      price: allowPricing ? parsed.data.price : existing.price,
      tuitionCurrency: allowPricing
        ? parsed.data.tuitionCurrency
        : existing.tuitionCurrency,
      capacity: parsed.data.capacity,
      applicationFee: contentCourse
        ? existing.applicationFee
        : allowPricing
          ? parsed.data.applicationFee
          : existing.applicationFee,
      campusId: contentCourse
        ? existing.campusId
        : parsed.data.campusId || null,
      departmentId: parsed.data.departmentId || null,
      formDefinitionId: contentCourse
        ? existing.formDefinitionId
        : parsed.data.formDefinitionId || null,
      requiredDocs: contentCourse
        ? existing.requiredDocs
        : parseDocs(parsed.data.requiredDocs),
      crmCatalogId: contentCourse
        ? existing.crmCatalogId
        : parsed.data.crmCatalogId || null,
      requiresCrmCallback: contentCourse
        ? existing.requiresCrmCallback
        : (parsed.data.requiresCrmCallback ?? false),
      ...(contentCourse ? {} : deliveryFields(parsed.data.deliveryMode)),
    },
  });

  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/programs");
  revalidatePath("/courses");
  return { ok: true as const };
}

export async function setProgramStatus(programId: string, status: ProgramStatus) {
  const session = await requireCapability("managePrograms");
  const program = await prisma.program.findFirst({
    where: { id: programId, organizationId: session.user.organizationId },
    include: { formDefinition: { include: { versions: { where: { isPublished: true } } } } },
  });
  if (!program) return { error: "Program not found." };

  if (status === "PUBLISHED") {
    if (
      !isContentProgram(program.category) &&
      (!program.formDefinitionId || !program.formDefinition?.versions.length)
    ) {
      return { error: "Attach a published application form before publishing." };
    }
  }

  await prisma.program.update({ where: { id: programId }, data: { status } });
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/programs");
  return { ok: true as const };
}

export async function createIntake(programId: string, formData: FormData) {
  const session = await requireCapability("managePrograms");
  const program = await prisma.program.findFirst({
    where: { id: programId, organizationId: session.user.organizationId },
  });
  if (!program) return { error: "Program not found." };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Intake name is required." };

  await prisma.intake.create({
    data: {
      programId,
      name,
      startDate: formData.get("startDate")
        ? new Date(String(formData.get("startDate")))
        : null,
      applicationOpen: formData.get("applicationOpen")
        ? new Date(String(formData.get("applicationOpen")))
        : null,
      applicationClose: formData.get("applicationClose")
        ? new Date(String(formData.get("applicationClose")))
        : null,
      capacity: formData.get("capacity")
        ? Number(formData.get("capacity"))
        : null,
      isActive: formData.get("isActive") !== "false",
    },
  });

  revalidatePath(`/admin/programs/${programId}`);
  return { ok: true as const };
}

export async function toggleIntake(intakeId: string, isActive: boolean) {
  const session = await requireCapability("managePrograms");
  const intake = await prisma.intake.findFirst({
    where: { id: intakeId, program: { organizationId: session.user.organizationId } },
  });
  if (!intake) return { error: "Intake not found." };
  await prisma.intake.update({ where: { id: intakeId }, data: { isActive } });
  revalidatePath(`/admin/programs/${intake.programId}`);
  return { ok: true as const };
}
