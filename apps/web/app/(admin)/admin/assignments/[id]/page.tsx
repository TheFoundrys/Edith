import { notFound } from "next/navigation";
import { AssignmentEditor } from "@/components/admin/assignment-editor";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminEditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageContent");
  const assignment = await prisma.assignment.findFirst({
    where: { id, organizationId: session.user.organizationId },
  });
  if (!assignment) notFound();

  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <AssignmentEditor
      programs={programs}
      assignment={{
        id: assignment.id,
        programId: assignment.programId,
        title: assignment.title,
        description: assignment.description,
        dueAt: assignment.dueAt?.toISOString() ?? null,
        isPublished: assignment.isPublished,
      }}
    />
  );
}
