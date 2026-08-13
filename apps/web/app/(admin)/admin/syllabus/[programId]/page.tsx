import { notFound } from "next/navigation";
import { SyllabusEditor } from "@/components/admin/syllabus-editor";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminSyllabusDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const session = await requireCapability("manageContent");
  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      organizationId: session.user.organizationId,
    },
    include: {
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!program) notFound();

  return (
    <SyllabusEditor
      program={{ id: program.id, name: program.title, slug: program.slug }}
      syllabus={program.syllabus}
    />
  );
}
