import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { canUser, requireAnyCapability } from "@/lib/auth/session";
import { listCompassAdminPrograms } from "@/lib/compass/admin-programs";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { isContentProgram, programCategoryLabel } from "@/lib/programs/categories";
import { formatCurrency } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "warning" as const;
}

export default async function AdminProgramsPage() {
  const session = await requireAnyCapability(["managePrograms", "managePricing"]);
  const canEditCatalog = canUser(session.user, "managePrograms");
  const compass = isCompassDatabase();
  const compassPrograms = compass
    ? await listCompassAdminPrograms(session.user.organizationId)
    : [];
  const programs = compass
    ? compassPrograms.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        category: p.category,
        degreeLevel: p.degreeLevel,
        price: p.price,
        tuitionCurrency: p.tuitionCurrency,
        campus: null as { name: string } | null,
        intakes: [] as { id: string }[],
        syllabus: { status: p.syllabusStatus },
        moduleCount: p.moduleCount,
        lessonCount: p.lessonCount,
        enrollmentCount: p.enrollmentCount,
      }))
    : await prisma.program.findMany({
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
          compass
            ? "Read-only view of Skill Compass courses on compass_dev. Edit content in Skill Compass."
            : canEditCatalog
              ? "YGP and PGP: section, title, and content. Degrees: CRM, enrollments, and online or offline payment."
              : "Review published tuition and catalog status. Catalog edits stay with academic staff."
        }
        actions={
          canEditCatalog && !compass ? (
            <Link href="/admin/programs/new">
              <Button>New program</Button>
            </Link>
          ) : undefined
        }
      />

      <p className="mb-[var(--grid-pad)] text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        YGP / PGP · Title → Sections → Publish · Degree · Admissions → CRM → Payment
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
              ? "Create a YGP or PGP with sections and content, or a degree with admissions and payment."
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
            const contentCourse = isContentProgram(program.category);
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
                  {"moduleCount" in program ? (
                    <>
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Modules</dt>
                        <dd className="text-fg text-right">{program.moduleCount}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Lessons</dt>
                        <dd className="text-fg text-right">{program.lessonCount}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Enrollments</dt>
                        <dd className="text-fg text-right">
                          {program.enrollmentCount}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">
                        {contentCourse ? "Setup" : "Intakes"}
                      </dt>
                      <dd className="text-fg text-right">
                        {contentCourse
                          ? "Section · title · content"
                          : program.intakes.length}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="mt-auto pt-[var(--grid-pad)] flex flex-wrap gap-2">
                  {canEditCatalog && !compass ? (
                    <Link href={`/admin/programs/${program.id}`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                  ) : null}
                  {canEditCatalog && !compass ? (
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
