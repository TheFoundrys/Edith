import { notFound } from "next/navigation";
import { QuizEditor } from "@/components/admin/quiz-editor";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminEditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageContent");
  const quiz = await prisma.quiz.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quiz) notFound();

  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <QuizEditor
      programs={programs}
      quiz={{
        id: quiz.id,
        programId: quiz.programId,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        questions: quiz.questions.map((q) => ({
          prompt: q.prompt,
          options: JSON.parse(q.optionsJson) as string[],
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
        })),
      }}
    />
  );
}
