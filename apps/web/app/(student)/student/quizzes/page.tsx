import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentQuizzesPage() {
  const session = await requireStudent();
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { programId: true },
  });
  const programIds = enrollments.map((e) => e.programId);

  const quizzes = programIds.length
    ? await prisma.quiz.findMany({
        where: { programId: { in: programIds }, status: "PUBLISHED" },
        include: {
          program: { select: { title: true } },
          _count: { select: { questions: true } },
          attempts: {
            where: { userId: session.user.id },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Knowledge checks for your enrolled courses."
      />

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes yet"
          description="Published quizzes from your courses will appear here."
        />
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const attempt = quiz.attempts[0];
            return (
              <Panel key={quiz.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/student/quizzes/${quiz.id}`}
                      className="font-medium hover:underline"
                    >
                      {quiz.title}
                    </Link>
                    <p className="mt-1 text-sm text-fg-muted">
                      {quiz.program.title} · {quiz._count.questions} questions
                      {attempt
                        ? ` · Last score ${attempt.score}/${attempt.maxScore}`
                        : ""}
                    </p>
                  </div>
                  <Badge tone={attempt ? "success" : "neutral"}>
                    {attempt ? "Attempted" : "Open"}
                  </Badge>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
