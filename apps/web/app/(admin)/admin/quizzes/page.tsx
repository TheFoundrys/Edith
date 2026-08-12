import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminQuizzesPage() {
  const session = await requireCapability("manageContent");
  const quizzes = await prisma.quiz.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      program: { select: { name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const published = quizzes.filter((q) => q.status === "PUBLISHED").length;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Quizzes"
        description="Create knowledge checks — manually or with the AI plugin."
        actions={
          <Link href="/admin/quizzes/new">
            <Button size="sm">New quiz</Button>
          </Link>
        }
      />

      {quizzes.length > 0 ? (
        <div className="peak-stats">
          <div className="peak-stat">
            <p className="peak-stat-label">Quizzes</p>
            <p className="peak-stat-value">{quizzes.length}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Published</p>
            <p className="peak-stat-value">{published}</p>
          </div>
        </div>
      ) : null}

      {quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes"
          description="Draft a quiz for a program, optionally with AI-generated questions."
          action={
            <Link href="/admin/quizzes/new">
              <Button size="sm">Create quiz</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {quizzes.map((q) => (
            <article key={q.id} className="peak-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                  {q.program.name}
                </p>
                <Badge
                  tone={
                    q.status === "PUBLISHED"
                      ? "success"
                      : q.status === "ARCHIVED"
                        ? "neutral"
                        : "info"
                  }
                >
                  {q.status}
                </Badge>
              </div>

              <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                <Link
                  href={`/admin/quizzes/${q.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {q.title}
                </Link>
              </h2>

              <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Questions</dt>
                  <dd className="font-medium tabular-nums">{q._count.questions}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Attempts</dt>
                  <dd className="font-medium tabular-nums">{q._count.attempts}</dd>
                </div>
              </dl>

              <div className="mt-auto pt-[var(--grid-pad)]">
                <Link href={`/admin/quizzes/${q.id}`}>
                  <Button size="sm">Edit</Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
