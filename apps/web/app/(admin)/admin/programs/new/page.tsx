import { NewProgramForm } from "@/components/admin/new-program-form";
import { canUser, requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function NewProgramPage() {
  const session = await requireCapability("managePrograms");
  const orgId = session.user.organizationId;
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
    <NewProgramForm
      campuses={campuses}
      departments={departments}
      forms={forms}
      canManagePricing={canUser(session.user, "managePricing")}
    />
  );
}
