import { QuizEditor } from "@/components/admin/quiz-editor";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminNewQuizPage() {
  const session = await requireCapability("manageContent");
  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <QuizEditor programs={programs} />;
}
