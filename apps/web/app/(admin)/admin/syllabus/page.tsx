import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function syllabusTone(status: string | null) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  if (status === "DRAFT") return "warning" as const;
  return "neutral" as const;
}

function syllabusLabel(status: string | null) {
  if (!status) return "None";
  return status;
}

export default async function AdminSyllabusListPage() {
  const session = await requireCapability("manageContent");
  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      syllabus: {
        include: {
          _count: { select: { modules: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const withSyllabus = programs.filter((p) => p.syllabus).length;
  const published = programs.filter(
    (p) => p.syllabus?.status === "PUBLISHED",
  ).length;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Syllabus"
        description="Course outline for each program: sections and activities. Learners see published courses after enrolment."
      />

      {programs.length > 0 ? (
        <div className="peak-stats">
          <div className="peak-stat">
            <p className="peak-stat-label">Programs</p>
            <p className="peak-stat-value">{programs.length}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">With syllabus</p>
            <p className="peak-stat-value">{withSyllabus}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Published</p>
            <p className="peak-stat-value">{published}</p>
          </div>
        </div>
      ) : null}

      {programs.length === 0 ? (
        <EmptyState
          title="No programs"
          description="Create a program before adding a course syllabus."
          action={
            <Link href="/admin/programs/new">
              <Button size="sm">New program</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {programs.map((program) => {
            const sections = program.syllabus?._count.modules ?? 0;
            const status = program.syllabus?.status ?? null;
            return (
              <article
                key={program.id}
                className="peak-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    /{program.slug}
                  </p>
                  <Badge tone={syllabusTone(status)}>
                    {syllabusLabel(status)}
                  </Badge>
                </div>

                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  <Link
                    href={`/admin/syllabus/${program.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {program.name}
                  </Link>
                </h2>

                <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Sections</dt>
                    <dd className="font-medium text-fg tabular-nums">
                      {sections}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Syllabus</dt>
                    <dd className="text-fg text-right">
                      {status === "PUBLISHED"
                        ? "Live for learners"
                        : status
                          ? "In progress"
                          : "Not started"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-auto pt-[var(--grid-pad)] flex flex-wrap gap-2">
                  <Link href={`/admin/syllabus/${program.id}`}>
                    <Button size="sm">
                      {program.syllabus ? "Edit" : "Create"}
                    </Button>
                  </Link>
                  {program.syllabus ? (
                    <Link href={`/admin/syllabus/${program.id}/progress`}>
                      <Button size="sm" variant="secondary">
                        Progress
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
