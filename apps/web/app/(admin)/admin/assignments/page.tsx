import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminAssignmentsPage() {
  const session = await requireCapability("manageContent");
  const assignments = await prisma.assignment.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      program: { select: { title: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const published = assignments.filter((a) => a.isPublished).length;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Assignments"
        description="Create course assignments — manually or with the AI plugin."
        actions={
          <Link href="/admin/assignments/new">
            <Button size="sm">New assignment</Button>
          </Link>
        }
      />

      {assignments.length > 0 ? (
        <div className="peak-stats">
          <div className="peak-stat">
            <p className="peak-stat-label">Assignments</p>
            <p className="peak-stat-value">{assignments.length}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Published</p>
            <p className="peak-stat-value">{published}</p>
          </div>
        </div>
      ) : null}

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments"
          description="Create an assignment for a program, optionally drafted by AI."
          action={
            <Link href="/admin/assignments/new">
              <Button size="sm">Create assignment</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {assignments.map((a) => (
            <article key={a.id} className="peak-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                  {a.program.title}
                </p>
                <Badge tone={a.isPublished ? "success" : "neutral"}>
                  {a.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>

              <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                <Link
                  href={`/admin/assignments/${a.id}`}
                  className="hover:underline underline-offset-2"
                >
                  {a.title}
                </Link>
              </h2>

              <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-muted">Submissions</dt>
                  <dd className="font-medium tabular-nums">
                    {a._count.submissions}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto pt-[var(--grid-pad)]">
                <Link href={`/admin/assignments/${a.id}`}>
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
