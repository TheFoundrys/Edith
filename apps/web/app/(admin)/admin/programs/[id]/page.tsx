import { notFound } from "next/navigation";
import { ProgramDetailClient } from "@/components/admin/program-detail";
import { can, requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("managePrograms");
  const orgId = session.user.organizationId;

  const program = await prisma.program.findFirst({
    where: { id, organizationId: orgId },
    include: { intakes: { orderBy: { createdAt: "desc" } } },
  });
  if (!program) notFound();

  const [campuses, departments, forms] = await Promise.all([
    prisma.campus.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.department.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.formDefinition.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ProgramDetailClient
      program={program}
      campuses={campuses}
      departments={departments}
      forms={forms}
      canManagePricing={can(session.user.role, "managePricing")}
    />
  );
}
