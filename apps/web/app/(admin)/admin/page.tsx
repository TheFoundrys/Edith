import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { can, requireStaff } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";
import type { ApplicationStatus } from "@prisma/client";

function toneFor(status: ApplicationStatus) {
  if (status === "ENROLLED" || status === "OFFERED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  if (status === "DRAFT") return "neutral" as const;
  return "info" as const;
}

export default async function AdminOverviewPage() {
  const session = await requireStaff();
  const orgId = session.user.organizationId;
  const role = session.user.role;

  const [programs, published, applications, submitted] = await Promise.all([
    prisma.program.count({ where: { organizationId: orgId } }),
    prisma.program.count({
      where: { organizationId: orgId, status: "PUBLISHED" },
    }),
    prisma.application.count({ where: { organizationId: orgId } }),
    prisma.application.count({
      where: { organizationId: orgId, status: { not: "DRAFT" } },
    }),
  ]);

  const recent = can(role, "manageApplications")
    ? await prisma.application.findMany({
        where: { organizationId: orgId },
        include: { applicant: true, program: true },
        orderBy: { updatedAt: "desc" },
        take: 6,
      })
    : [];

  return (
    <div className="peak-rise">
      <PageHeader
        title="Workspace"
        description="Catalog, content, and enrolments in one place."
      />

      <div className="peak-stats">
        {[
          { label: "Programs", value: programs },
          { label: "Published", value: published },
          { label: "Applications", value: applications },
          { label: "Submitted+", value: submitted },
        ].map((stat) => (
          <div key={stat.label} className="peak-stat">
            <p className="peak-stat-label">{stat.label}</p>
            <p className="peak-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-[var(--grid-pad)] flex flex-wrap gap-2">
        {can(role, "managePrograms") ? (
          <Link href="/admin/programs">
            <Button>Open programs</Button>
          </Link>
        ) : null}
        {can(role, "manageContent") ? (
          <Link href="/admin/syllabus">
            <Button variant="secondary">Syllabus</Button>
          </Link>
        ) : null}
        {can(role, "manageApplications") ? (
          <Link href="/admin/applications">
            <Button variant="secondary">Applications</Button>
          </Link>
        ) : null}
      </div>

      {can(role, "manageApplications") ? (
        <section>
          <div className="mb-[var(--grid-gap)] flex items-end justify-between gap-3">
            <h2 className="font-display text-xl text-fg">Recent applications</h2>
            <Link
              href="/admin/applications"
              className="text-xs text-fg-muted hover:text-fg underline underline-offset-2"
            >
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="peak-card">
              <p className="text-sm text-fg-muted">No applications yet.</p>
            </div>
          ) : (
            <div className="cm-grid">
              {recent.map((app) => (
                <article key={app.id} className="peak-card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      {app.updatedAt.toLocaleDateString()}
                    </p>
                    <Badge tone={toneFor(app.status)}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </div>
                  <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="hover:underline underline-offset-2"
                    >
                      {app.applicant.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-fg-muted">{app.program.title}</p>
                  <div className="mt-auto pt-[var(--grid-pad)]">
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button size="sm" variant="secondary">
                        Review
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="peak-card">
          <p className="text-sm text-fg-muted leading-relaxed">
            Use the sidebar for tools available to your role. Pricing stays with
            admins; content uploaders work in Syllabus, Assignments, and Quizzes.
          </p>
        </div>
      )}
    </div>
  );
}
