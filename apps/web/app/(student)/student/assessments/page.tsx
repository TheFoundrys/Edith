import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentAssessmentsPage() {
  const session = await requireStudent();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { programId: true },
  });
  const programIds = enrollments.map((e) => e.programId);

  const [assignments, quizzes] = programIds.length
    ? await Promise.all([
        prisma.assignment.findMany({
          where: { programId: { in: programIds }, isPublished: true },
          include: {
            program: { select: { name: true } },
            submissions: {
              where: { userId: session.user.id },
              take: 1,
            },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        }),
        prisma.quiz.findMany({
          where: { programId: { in: programIds }, status: "PUBLISHED" },
          include: {
            program: { select: { name: true } },
            _count: { select: { questions: true } },
            attempts: {
              where: { userId: session.user.id },
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
      ])
    : [[], []];

  const empty = assignments.length === 0 && quizzes.length === 0;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Assignments & Quizzes"
        description="Course work from your enrollments — submit assignments and take quizzes here."
      />

      {empty ? (
        <EmptyState
          title="No assessments yet"
          description="Enroll in a course, then assignments and quizzes will show up here."
          action={
            <Link href="/student/enroll">
              <Button size="sm">Enroll in a course</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-[var(--grid-pad)]">
          <section>
            <div className="mb-[var(--grid-gap)] flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-fg">Assignments</h2>
              <Link
                href="/student/assignments"
                className="text-xs text-fg-muted underline underline-offset-2"
              >
                View all
              </Link>
            </div>
            {assignments.length === 0 ? (
              <p className="text-sm text-fg-muted">No assignments published.</p>
            ) : (
              <div className="cm-grid">
                {assignments.map((assignment) => {
                  const submission = assignment.submissions[0];
                  return (
                    <article key={assignment.id} className="peak-card">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                          {assignment.program.name}
                        </p>
                        <Badge tone={submission ? "success" : "warning"}>
                          {submission ? "Submitted" : "Open"}
                        </Badge>
                      </div>
                      <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {assignment.title}
                        </Link>
                      </h3>
                      {assignment.dueAt ? (
                        <p className="mt-2 text-sm text-fg-muted">
                          Due {assignment.dueAt.toLocaleDateString()}
                        </p>
                      ) : null}
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <Link href={`/student/assignments/${assignment.id}`}>
                          <Button size="sm">
                            {submission ? "View" : "Start"}
                          </Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="mb-[var(--grid-gap)] flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-fg">Quizzes</h2>
              <Link
                href="/student/quizzes"
                className="text-xs text-fg-muted underline underline-offset-2"
              >
                View all
              </Link>
            </div>
            {quizzes.length === 0 ? (
              <p className="text-sm text-fg-muted">No quizzes published.</p>
            ) : (
              <div className="cm-grid">
                {quizzes.map((quiz) => {
                  const attempt = quiz.attempts[0];
                  return (
                    <article key={quiz.id} className="peak-card">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                          {quiz.program.name}
                        </p>
                        <Badge tone={attempt ? "success" : "neutral"}>
                          {attempt
                            ? `Score ${attempt.score ?? "—"}`
                            : `${quiz._count.questions} questions`}
                        </Badge>
                      </div>
                      <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                        <Link
                          href={`/student/quizzes/${quiz.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {quiz.title}
                        </Link>
                      </h3>
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <Link href={`/student/quizzes/${quiz.id}`}>
                          <Button size="sm">
                            {attempt ? "Retake / review" : "Take quiz"}
                          </Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
