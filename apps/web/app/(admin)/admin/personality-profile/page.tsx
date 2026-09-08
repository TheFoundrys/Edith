import Link from "next/link";
import { requireCapability } from "@/lib/auth/session";
import { getPersonalityTrainerRoster } from "@/lib/actions/personality-profile";
import { PageHeader, Panel } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  paginateItems,
  parsePage,
  resolvePageSize,
} from "@/lib/pagination";

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

  return (
    <div>
      <PageHeader
        title="Personality Profile"
        description="Ranked Edith Personality Profile sittings. Open a student for the trainer brief — no Aadhaar or PAN."
      />
      <Panel className="p-5 pb-0">
        {rows.length === 0 ? (
          <p className="mb-5 text-sm text-fg-muted">No candidates yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {slice.items.map((row) => (
              <li
                key={row.userId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <Link
                    href={`/admin/personality-profile/${row.userId}`}
                    className="font-medium hover:underline"
                  >
                    {row.name}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    {row.email}
                    {row.keywords.length ? ` · ${row.keywords.join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {row.rank ? (
                    <Badge tone="success">
                      #{row.rank}
                      {row.percentile ? ` · ${row.percentile}th` : ""}
                    </Badge>
                  ) : (
                    <Badge>{row.status}</Badge>
                  )}
                  {row.aptitudeBand ? (
                    <span className="text-xs text-fg-muted">
                      {row.aptitudeBand} / {row.quantitativeBand} · {row.psycheLabel}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
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
