import { notFound, redirect } from "next/navigation";
import { ProgramDetailClient } from "@/components/admin/program-detail";
import { canUser, requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("managePrograms");
  if (isCompassDatabase()) redirect("/admin/programs");
  const orgId = session.user.organizationId;

  const program = await prisma.program.findFirst({
    where: { id, organizationId: orgId },
    include: { intakes: { orderBy: { createdAt: "desc" } } },
  });
  if (!program) notFound();

  const [campuses, departments, forms, courseMcqs, lessonMcqCount] =
    await Promise.all([
    prisma.campus.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.department.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.formDefinition.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    prisma.courseMcq.findMany({
      where: { programId: id, organizationId: orgId },
      select: { id: true, title: true, status: true, setNumber: true },
      orderBy: [{ setNumber: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.lessonMcq.count({
      where: { programId: id, organizationId: orgId },
    }),
  ]);

  return (
    <ProgramDetailClient
      program={program}
      campuses={campuses}
      departments={departments}
      forms={forms}
      canManagePricing={canUser(session.user, "managePricing")}
      courseMcqs={courseMcqs}
      lessonMcqCount={lessonMcqCount}
    />
  );
}
