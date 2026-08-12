"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { emptyFormSchema, formSchemaSchema } from "@/lib/forms/schema";

export async function createFormDefinition(formData: FormData) {
  const session = await requireCapability("manageForms");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
  if (!org) {
    return { error: "Your session is out of date. Sign out and sign in again." };
  }

  const form = await prisma.formDefinition.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      description: String(formData.get("description") || "") || null,
      versions: {
        create: {
          version: 1,
          isPublished: false,
          schemaJson: JSON.stringify(emptyFormSchema()),
        },
      },
    },
    include: { versions: true },
  });

  revalidatePath("/admin/forms");
  return { ok: true as const, id: form.id, versionId: form.versions[0]?.id };
}

export async function saveFormDraft(formDefinitionId: string, schemaJson: string) {
  const session = await requireCapability("manageForms");
  const form = await prisma.formDefinition.findFirst({
    where: { id: formDefinitionId, organizationId: session.user.organizationId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!form) return { error: "Form not found." };

  let parsed;
  try {
    parsed = formSchemaSchema.parse(JSON.parse(schemaJson));
  } catch {
    return { error: "Invalid form schema." };
  }

  const latest = form.versions[0];
  if (!latest) return { error: "No form version found." };

  if (latest.isPublished) {
    const created = await prisma.formVersion.create({
      data: {
        formDefinitionId,
        version: latest.version + 1,
        isPublished: false,
        schemaJson: JSON.stringify(parsed),
      },
    });
    revalidatePath(`/admin/forms/${formDefinitionId}`);
    return { ok: true as const, versionId: created.id };
  }

  await prisma.formVersion.update({
    where: { id: latest.id },
    data: { schemaJson: JSON.stringify(parsed) },
  });
  revalidatePath(`/admin/forms/${formDefinitionId}`);
  return { ok: true as const, versionId: latest.id };
}

export async function publishFormVersion(formDefinitionId: string) {
  const session = await requireCapability("manageForms");
  const form = await prisma.formDefinition.findFirst({
    where: { id: formDefinitionId, organizationId: session.user.organizationId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!form?.versions[0]) return { error: "Form not found." };

  const latest = form.versions[0];
  if (latest.isPublished) return { ok: true as const, versionId: latest.id };

  await prisma.formVersion.update({
    where: { id: latest.id },
    data: { isPublished: true, publishedAt: new Date() },
  });

  revalidatePath(`/admin/forms/${formDefinitionId}`);
  revalidatePath("/admin/forms");
  return { ok: true as const, versionId: latest.id };
}

const attachSchema = z.object({
  programId: z.string().min(1),
  formDefinitionId: z.string().min(1),
});

export async function attachFormToProgram(formData: FormData) {
  const session = await requireCapability("manageForms");
  const parsed = attachSchema.safeParse({
    programId: formData.get("programId"),
    formDefinitionId: formData.get("formDefinitionId"),
  });
  if (!parsed.success) return { error: "Invalid attachment." };

  const [program, form] = await Promise.all([
    prisma.program.findFirst({
      where: { id: parsed.data.programId, organizationId: session.user.organizationId },
    }),
    prisma.formDefinition.findFirst({
      where: {
        id: parsed.data.formDefinitionId,
        organizationId: session.user.organizationId,
      },
    }),
  ]);
  if (!program || !form) return { error: "Program or form not found." };

  await prisma.program.update({
    where: { id: program.id },
    data: { formDefinitionId: form.id },
  });

  revalidatePath(`/admin/programs/${program.id}`);
  return { ok: true as const };
}
