import Link from "next/link";
import { PersonalityLeaderboardTable } from "@/components/student/personality-leaderboard";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { loadPersonalityLeaderboard } from "@/lib/assessments/personality-board";
import {
  paginateItems,
  parsePage,
  resolvePageSize,
} from "@/lib/pagination";
import { PERSONALITY_PROFILE_HREF } from "@/lib/assessments/personality-profile";
import { requireStudent } from "@/lib/auth/session";

export default async function PersonalityStudentRankPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const session = await requireStudent();
  const sp = await searchParams;
  const rows = await loadPersonalityLeaderboard(session.user.organizationId);
  const pageSize = resolvePageSize(sp.pageSize);
  const highlightIndex = rows.findIndex((row) => row.userId === session.user.id);
  const defaultPage =
    highlightIndex >= 0 ? Math.floor(highlightIndex / pageSize) + 1 : 1;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = sp.page
    ? parsePage(sp.page, totalPages)
    : Math.min(defaultPage, totalPages);
  const slice = paginateItems(rows, page, pageSize);
  const path = `${PERSONALITY_PROFILE_HREF}/rank`;

  return (
    <div>
      <PageHeader
        title="Rank board"
        description="Public rank from the Edith Personality Profile sitting. Names and bands only — never Aadhaar or resume text."
        actions={
          <Link href={PERSONALITY_PROFILE_HREF}>
            <Button size="sm" variant="ghost">
              Back
            </Button>
          </Link>
        }
      />
      <Panel className="p-5 pb-0">
        <PersonalityLeaderboardTable
          rows={slice.items}
          highlightUserId={session.user.id}
        />
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
