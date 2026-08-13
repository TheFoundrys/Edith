import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { programCategoryLabel } from "@/lib/programs/categories";
import { formatCurrency } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "warning" as const;
}

export default async function AdminProgramsPage() {
  const session = await requireCapability("managePrograms");
  const programs = await prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      department: true,
      campus: true,
      intakes: true,
      syllabus: { select: { status: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const published = programs.filter((p) => p.status === "PUBLISHED").length;
  const drafts = programs.filter((p) => p.status === "DRAFT").length;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Programs"
        description="Build the catalog — set details and pricing, add a syllabus, then publish to go live."
        actions={
          <Link href="/admin/programs/new">
            <Button>New program</Button>
          </Link>
        }
      />

      <p className="mb-[var(--grid-pad)] text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        Flow · Details → Pricing → Syllabus → Publish → Live course
      </p>

      <div className="peak-stats">
        <div className="peak-stat">
          <p className="peak-stat-label">Total</p>
          <p className="peak-stat-value">{programs.length}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Published</p>
          <p className="peak-stat-value">{published}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Drafts</p>
          <p className="peak-stat-value">{drafts}</p>
        </div>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          title="No programs yet"
          description="Create your first program, set pricing, then publish it to the course catalog."
          action={
            <Link href="/admin/programs/new">
              <Button>Create program</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {programs.map((program) => {
            const syllabusReady = program.syllabus?.status === "PUBLISHED";
            return (
              <article
                key={program.id}
                className="peak-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    {programCategoryLabel(program.category)}
                  </p>
                  <Badge tone={statusTone(program.status)}>{program.status}</Badge>
                </div>

                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  <Link
                    href={`/admin/programs/${program.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {program.title}
                  </Link>
                </h2>

                <p className="mt-1 text-xs text-fg-muted">
                  {program.degreeLevel.replaceAll("_", " ")}
                  {program.campus ? ` · ${program.campus.name}` : ""}
                </p>

                <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Tuition</dt>
                    <dd className="font-medium text-fg text-right">
                      {program.price == null || program.price === 0
                        ? program.price === 0
                          ? "Free"
                          : "Not set"
                        : formatCurrency(
                            program.price,
                            program.tuitionCurrency,
                          )}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Syllabus</dt>
                    <dd className="text-fg text-right">
                      {syllabusReady
                        ? "Published"
                        : program.syllabus
                          ? "Draft"
                          : "Missing"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Intakes</dt>
                    <dd className="text-fg text-right">{program.intakes.length}</dd>
                  </div>
                </dl>

                <div className="mt-auto pt-[var(--grid-pad)] flex flex-wrap gap-2">
                  <Link href={`/admin/programs/${program.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Link href={`/admin/syllabus/${program.id}`}>
                    <Button size="sm" variant="secondary">
                      Syllabus
                    </Button>
                  </Link>
                  {program.status === "PUBLISHED" ? (
                    <Link href={`/courses/${program.slug}`} target="_blank">
                      <Button size="sm" variant="ghost">
                        View live
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
