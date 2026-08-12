import { notFound } from "next/navigation";
import { FormBuilder } from "@/components/admin/form-builder";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseFormSchema } from "@/lib/forms/schema";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageForms");
  const form = await prisma.formDefinition.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!form?.versions[0]) notFound();

  const latest = form.versions[0];
  const schema = parseFormSchema(latest.schemaJson);

  return (
    <FormBuilder
      formId={form.id}
      name={form.name}
      description={form.description}
      initialSchema={schema}
      version={latest.version}
      isPublished={latest.isPublished}
    />
  );
}
