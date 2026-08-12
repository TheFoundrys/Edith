import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";
import type { ApplicationStatus } from "@prisma/client";

const PAGE_SIZE = 20;

function toneFor(status: ApplicationStatus) {
  if (status === "ENROLLED" || status === "OFFERED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  if (status === "DRAFT") return "neutral" as const;
  return "info" as const;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    programId?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const session = await requireCapability("manageApplications");
  const sp = await searchParams;
  const orgId = session.user.organizationId;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() ?? "";

  const programs = await prisma.program.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const where = {
    organizationId: orgId,
    ...(sp.status ? { status: sp.status as ApplicationStatus } : {}),
    ...(sp.programId ? { programId: sp.programId } : {}),
    ...(q
      ? {
          OR: [
            { applicant: { name: { contains: q } } },
            { applicant: { email: { contains: q } } },
            { program: { name: { contains: q } } },
          ],
        }
      : {}),
  };

  const [total, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: { applicant: true, program: true, intake: true },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (sp.status) params.set("status", sp.status);
    if (sp.programId) params.set("programId", sp.programId);
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/applications?${qs}` : "/admin/applications";
  }

  return (
    <div className="peak-rise">
      <PageHeader
        title="Applications"
        description="Review submissions and advance workflow status."
      />

      <form className="flex flex-wrap gap-3 mb-[var(--grid-pad)]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search applicant, email, program"
          className="h-9 min-w-[14rem] flex-1 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ""}
          className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="programId"
          defaultValue={sp.programId ?? ""}
          className="h-9 rounded-[var(--radius-sm)] border border-border-strong bg-bg-elevated/90 px-3 text-sm"
        >
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-9 px-3 text-sm rounded-[var(--radius-sm)] bg-accent text-accent-fg"
        >
          Filter
        </button>
      </form>

      {applications.length === 0 ? (
        <EmptyState
          title="No applications"
          description="Submitted applications will appear here."
        />
      ) : (
        <>
          <div className="cm-grid">
            {applications.map((app) => (
              <article key={app.id} className="peak-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    {app.updatedAt.toLocaleDateString()}
                  </p>
                  <Badge tone={toneFor(app.status)}>
                    {APPLICATION_STATUS_LABELS[app.status]}
                  </Badge>
                </div>

                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {app.applicant.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-fg-muted">{app.applicant.email}</p>

                <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-fg-muted">Program</dt>
                    <dd className="text-fg text-right">{app.program.name}</dd>
                  </div>
                  {app.intake ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-fg-muted">Intake</dt>
                      <dd className="text-fg text-right">{app.intake.name}</dd>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-auto pt-[var(--grid-pad)]">
                  <Link href={`/admin/applications/${app.id}`}>
                    <Button size="sm">Review</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-fg-muted">
            <p>
              {total} result{total === 1 ? "" : "s"}
              {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
            </p>
            {totalPages > 1 ? (
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="underline underline-offset-2">
                    Previous
                  </Link>
                ) : null}
                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="underline underline-offset-2">
                    Next
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
