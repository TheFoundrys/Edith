import { notFound } from "next/navigation";
import { QuizEditor } from "@/components/admin/quiz-editor";
import { requireCapability } from "@/lib/auth/session";
import { listStaffProgramOptions } from "@/lib/compass/program-bridge";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";

export default async function AdminEditQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirectIfCompassAdminRoute();
  const { id } = await params;
  const session = await requireCapability("manageContent");
  const quiz = await prisma.quiz.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quiz) notFound();

  const programOptions = await listStaffProgramOptions(
    session.user.organizationId,
  );
  const programs = programOptions.map((program) => ({
    id: program.id,
    title: program.title,
  }));

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
