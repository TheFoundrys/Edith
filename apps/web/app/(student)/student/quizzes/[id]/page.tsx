import Link from "next/link";
import { notFound } from "next/navigation";
import { QuizTakeForm } from "@/components/student/quiz-take-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentQuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStudent();

  const quiz = await prisma.quiz.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      program: { select: { id: true, title: true } },
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quiz) notFound();

  const enrolled = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: quiz.programId,
      status: "ACTIVE",
    },
  });
  if (!enrolled) notFound();

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id, userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <PageHeader
        title={quiz.title}
        description={quiz.program.title}
        actions={
          <Link href="/student/quizzes" className="text-sm text-fg-muted underline">
            All quizzes
          </Link>
        }
      />

      {quiz.description ? (
        <p className="mb-6 text-sm text-fg-muted">{quiz.description}</p>
      ) : null}

      {attempts.length > 0 ? (
        <Panel className="mb-6 p-4">
          <p className="text-sm font-medium mb-2">Previous attempts</p>
          <ul className="space-y-1 text-sm text-fg-muted">
            {attempts.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <Badge tone="neutral">
                  {a.score}/{a.maxScore}
                </Badge>
                <span>{a.submittedAt.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel className="p-5">
        <QuizTakeForm
          quizId={quiz.id}
          questions={quiz.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            options: JSON.parse(q.optionsJson) as string[],
          }))}
        />
      </Panel>
    </div>
  );
}
