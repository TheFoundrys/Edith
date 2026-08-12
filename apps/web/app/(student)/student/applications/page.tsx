import Link from "next/link";
import { StartApplicationButton } from "@/components/student/start-application-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";
import type { ApplicationStatus } from "@prisma/client";

function toneFor(status: ApplicationStatus) {
  if (status === "ENROLLED" || status === "OFFERED" || status === "PAID") {
    return "success" as const;
  }
  if (status === "REJECTED") return "danger" as const;
  if (status === "DRAFT") return "neutral" as const;
  return "info" as const;
}

export default async function StudentApplicationsPage() {
  const session = await requireStudent();
  const orgId = session.user.organizationId;

  const [applications, openPrograms] = await Promise.all([
    prisma.application.findMany({
      where: { applicantId: session.user.id, organizationId: orgId },
      include: {
        program: { select: { id: true, name: true, slug: true } },
        intake: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.program.findMany({
      where: {
        organizationId: orgId,
        status: "PUBLISHED",
        formDefinitionId: { not: null },
        formDefinition: {
          versions: { some: { isPublished: true } },
        },
      },
      include: {
        intakes: {
          where: { isActive: true },
          orderBy: { startDate: "asc" },
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeAppProgramIds = new Set(
    applications
      .filter((a) => a.status !== "REJECTED")
      .map((a) => a.programId),
  );

  const applyable = openPrograms.filter(
    (p) => p.intakes.length > 0 && !activeAppProgramIds.has(p.id),
  );

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Start or continue admission applications for open programmes."
      />

      <div className="space-y-8">
        <section>
          <h2 className="text-sm font-medium mb-3">Your applications</h2>
          {applications.length === 0 ? (
            <EmptyState
              title="No applications yet"
              description="Choose a programme below to begin."
            />
          ) : (
            <ul className="space-y-2">
              {applications.map((app) => (
                <li key={app.id}>
                  <Panel className="p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Link
                        href={`/student/applications/${app.id}`}
                        className="font-medium text-brand underline-offset-2 hover:underline"
                      >
                        {app.program.name}
                      </Link>
                      <p className="text-xs text-fg-muted mt-1">
                        {app.intake ? `${app.intake.name} · ` : ""}
                        Updated {app.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={toneFor(app.status)}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Badge>
                      <Link
                        href={`/student/applications/${app.id}`}
                        className="text-sm underline text-brand"
                      >
                        {app.status === "DRAFT" ? "Continue" : "View"}
                      </Link>
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium mb-3">Open for applications</h2>
          {applyable.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No additional programmes are open for application right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {applyable.map((program) => (
                <li key={program.id}>
                  <Panel className="p-4 flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{program.name}</p>
                      <p className="text-xs text-fg-muted mt-1">
                        {program.intakes.length} open intake
                        {program.intakes.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <StartApplicationButton
                      programId={program.id}
                      intakes={program.intakes}
                    />
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
