import { AssignmentEditor } from "@/components/admin/assignment-editor";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminNewAssignmentPage() {
  const session = await requireCapability("manageContent");
  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return <AssignmentEditor programs={programs} />;
}
