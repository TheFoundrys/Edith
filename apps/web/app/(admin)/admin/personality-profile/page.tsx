import Link from "next/link";
import { requireCapability } from "@/lib/auth/session";
import { getPersonalityTrainerRoster } from "@/lib/actions/personality-profile";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import {
  paginateItems,
  parsePage,
  resolvePageSize,
} from "@/lib/pagination";

function intakeTone(
  stage: string,
): "success" | "warning" | "neutral" | "info" {
  if (stage === "complete") return "success";
  if (stage === "exam" || stage === "resume") return "info";
  if (stage === "identity" || stage === "contact") return "warning";
  return "neutral";
}

export default async function AdminPersonalityRosterPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  await requireCapability("manageApplications");
  const sp = await searchParams;
  const { rows } = await getPersonalityTrainerRoster();
  const pageSize = resolvePageSize(sp.pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = parsePage(sp.page, totalPages);
  const slice = paginateItems(rows, page, pageSize);
  const path = "/admin/personality-profile";

  const withContact = rows.filter((row) => row.phone && row.email).length;
  const withResume = rows.filter((row) => row.hasResume).length;

  return (
    <div>
      <PageHeader
        title="Personality Profile intake"
        description="Identity, Aadhaar, PAN, and resumes from the Edith Personality Profile wizard. Open a row for the full record."
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm text-fg-muted">
        <span>{rows.length} candidates</span>
        <span>·</span>
        <span>{withContact} with phone & email</span>
        <span>·</span>
        <span>{withResume} with resume</span>
      </div>

      <Panel className="overflow-x-auto p-0">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-fg-muted">No intake records yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Aadhaar</th>
                <th className="px-4 py-3 font-medium">PAN</th>
                <th className="px-4 py-3 font-medium">Resume</th>
                <th className="px-4 py-3 font-medium">Intake</th>
                <th className="px-4 py-3 font-medium text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {slice.items.map((row) => (
                <tr
                  key={row.userId}
                  className="border-b border-border last:border-0 hover:bg-bg/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/personality-profile/${row.userId}`}
                      className="font-medium hover:underline"
                    >
                      {row.name}
                    </Link>
                    {row.rank ? (
                      <p className="text-xs text-fg-muted mt-0.5">
                        Rank #{row.rank}
                        {row.percentile ? ` · ${row.percentile}th pct` : ""}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                    {row.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap font-mono text-xs">
                    {row.aadhaarMask || "—"}
                  </td>
                  <td className="px-4 py-3 text-fg-muted whitespace-nowrap font-mono text-xs">
                    {row.panMask || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {row.hasResume ? (
                      <span className="text-fg" title={row.resumeFileName ?? undefined}>
                        {row.resumeFileName}
                      </span>
                    ) : (
                      <span className="text-fg-muted">—</span>
                    )}
                    {row.keywords.length ? (
                      <p className="text-xs text-fg-muted mt-0.5 truncate max-w-[180px]">
                        {row.keywords.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={intakeTone(row.intakeStage)}>
                      {row.intakeLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/personality-profile/${row.userId}`}
                      className="text-xs underline text-fg-muted"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      {rows.length > 0 ? (
        <div className="border-x border-b border-border">
          <Pagination
            page={slice.page}
            totalPages={slice.totalPages}
            pageSize={pageSize}
            total={rows.length}
            pathname={path}
          />
        </div>
      ) : null}
    </div>
  );
}
