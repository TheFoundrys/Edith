import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { CreateFormButton } from "@/components/admin/create-form-button";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function AdminFormsPage() {
  const session = await requireCapability("manageForms");
  const forms = await prisma.formDefinition.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      _count: { select: { programs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const published = forms.filter((f) => f.versions[0]?.isPublished).length;

  return (
    <div className="peak-rise">
      <PageHeader
        title="Application forms"
        description="Versioned dynamic forms attached to programs."
        actions={<CreateFormButton />}
      />

      {forms.length > 0 ? (
        <div className="peak-stats">
          <div className="peak-stat">
            <p className="peak-stat-label">Forms</p>
            <p className="peak-stat-value">{forms.length}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Published</p>
            <p className="peak-stat-value">{published}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Drafts</p>
            <p className="peak-stat-value">{forms.length - published}</p>
          </div>
        </div>
      ) : null}

      {forms.length === 0 ? (
        <EmptyState
          title="No forms yet"
          description="Create a form definition, then publish a version for applicants."
          action={<CreateFormButton />}
        />
      ) : (
        <div className="cm-grid">
          {forms.map((form) => {
            const latest = form.versions[0];
            return (
              <article key={form.id} className="peak-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    {form._count.programs} program
                    {form._count.programs === 1 ? "" : "s"}
                  </p>
                  {latest ? (
                    <Badge tone={latest.isPublished ? "success" : "warning"}>
                      v{latest.version} ·{" "}
                      {latest.isPublished ? "published" : "draft"}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">No version</Badge>
                  )}
                </div>

                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  <Link
                    href={`/admin/forms/${form.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {form.name}
                  </Link>
                </h2>

                {form.description ? (
                  <p className="mt-2 text-sm text-fg-muted line-clamp-2 leading-relaxed">
                    {form.description}
                  </p>
                ) : null}

                <div className="mt-auto pt-[var(--grid-pad)]">
                  <Link href={`/admin/forms/${form.id}`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
