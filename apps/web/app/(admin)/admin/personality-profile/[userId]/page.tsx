import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/session";
import { getPersonalityTrainerDetail } from "@/lib/actions/personality-profile";
import { PersonalityReportView } from "@/components/student/personality-report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { loadPublishedProgramsBySlugs } from "@/lib/marketing/public-course-detail";
import { displayProgramName } from "@/lib/programs/categories";
import { uploadUrl } from "@/lib/urls";

function intakeTone(
  stage: string,
): "success" | "warning" | "neutral" | "info" {
  if (stage === "complete") return "success";
  if (stage === "exam" || stage === "resume") return "info";
  if (stage === "identity" || stage === "contact") return "warning";
  return "neutral";
}

export default async function AdminPersonalityDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireCapability("manageApplications");
  const { userId } = await params;
  const detail = await getPersonalityTrainerDetail(userId);
  if (!detail.ok) notFound();

  const slugs = detail.report?.recommendations.map((item) => item.slug) ?? [];
  const programs = slugs.length
    ? await loadPublishedProgramsBySlugs(slugs, session.user.organizationId)
    : [];
  const titles = Object.fromEntries(
    programs.map((program) => [
      program.slug,
      displayProgramName(program.title, program.category),
    ]),
  );

  const displayName = detail.student.fullName || detail.student.name;

  return (
    <div>
      <PageHeader
        title={displayName}
        description="Applicant intake record · Edith Personality Profile"
        actions={
          <Link href="/admin/personality-profile">
            <Button size="sm" variant="ghost">
              All intake records
            </Button>
          </Link>
        }
      />

      <Panel className="mb-6 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl">Identity</h2>
          <Badge tone={intakeTone(detail.intake.stage)}>
            {detail.intake.label}
          </Badge>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Display name
            </dt>
            <dd className="mt-1 font-medium">{detail.student.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Full legal name
            </dt>
            <dd className="mt-1">{detail.student.fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Email
            </dt>
            <dd className="mt-1">
              {detail.student.email ? (
                <a
                  href={`mailto:${detail.student.email}`}
                  className="underline underline-offset-2"
                >
                  {detail.student.email}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Phone
            </dt>
            <dd className="mt-1">
              {detail.student.phone ? (
                <a
                  href={`tel:${detail.student.phone}`}
                  className="underline underline-offset-2"
                >
                  {detail.student.phone}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Aadhaar
            </dt>
            <dd className="mt-1 font-mono text-sm">
              {detail.student.aadhaarMask || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              PAN
            </dt>
            <dd className="mt-1 font-mono text-sm">
              {detail.student.panMask || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-fg-muted">
              Address
            </dt>
            <dd className="mt-1 whitespace-pre-wrap">
              {detail.student.address || "—"}
            </dd>
          </div>
        </dl>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
            Resume
          </p>
          {detail.resume ? (
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">{detail.resume.fileName}</p>
                {detail.resume.uploadedAt ? (
                  <p className="text-xs text-fg-muted mt-0.5">
                    Uploaded{" "}
                    {new Date(detail.resume.uploadedAt).toLocaleString()}
                  </p>
                ) : null}
                {detail.resume.skills.length ? (
                  <p className="text-sm text-fg-muted mt-2">
                    Skills detected: {detail.resume.skills.join(", ")}
                  </p>
                ) : detail.resume.keywords.length ? (
                  <p className="text-sm text-fg-muted mt-2">
                    Tracks: {detail.resume.keywords.join(", ")}
                  </p>
                ) : null}
              </div>
              <Link
                href={uploadUrl(detail.resume.storagePath)}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="secondary">
                  Download resume
                </Button>
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-sm text-fg-muted">No resume uploaded yet.</p>
          )}
        </div>

        <p className="text-xs text-fg-muted">
          Last updated {new Date(detail.intake.updatedAt).toLocaleString()}
          {detail.student.headline ? ` · ${detail.student.headline}` : ""}
        </p>
      </Panel>

      <Panel className="mb-6 p-5">
        <h2 className="font-display text-xl">Trainer brief</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {detail.brief.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>

      {detail.report ? (
        <PersonalityReportView
          report={detail.report}
          titles={titles}
          rank={detail.rank}
        />
      ) : (
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">
            Exam not submitted yet — contact and resume above are still available
            for follow-up.
          </p>
        </Panel>
      )}
    </div>
  );
}
