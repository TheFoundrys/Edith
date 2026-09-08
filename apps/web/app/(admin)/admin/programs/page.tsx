import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { canUser, requireAnyCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { programCategoryLabel } from "@/lib/programs/categories";
import { formatCurrency } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "warning" as const;
}

export default async function AdminProgramsPage() {
  const session = await requireAnyCapability(["managePrograms", "managePricing"]);
  const canEditCatalog = canUser(session.user, "managePrograms");
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
    <div>
      <PageHeader
        title="Programs"
        description={
          canEditCatalog
            ? "Build the catalog — set details and pricing, add a syllabus, then publish to go live."
            : "Review published tuition and catalog status. Catalog edits stay with academic staff."
        }
        actions={
          canEditCatalog ? (
            <Link href="/admin/programs/new">
              <Button>New program</Button>
            </Link>
          ) : undefined
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
          description={
            canEditCatalog
              ? "Create your first program, set pricing, then publish it to the course catalog."
              : "No programs are in the catalog yet."
          }
          action={
            canEditCatalog ? (
              <Link href="/admin/programs/new">
                <Button>Create program</Button>
              </Link>
            ) : undefined
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
                  {canEditCatalog ? (
                    <Link
                      href={`/admin/programs/${program.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {program.title}
                    </Link>
                  ) : (
                    program.title
                  )}
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
                  {canEditCatalog ? (
                    <Link href={`/admin/programs/${program.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                  ) : null}
                  {canEditCatalog ? (
                    <Link href={`/admin/syllabus/${program.id}`}>
                      <Button size="sm" variant="secondary">
                        Syllabus
                      </Button>
                    </Link>
                  ) : null}
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
