import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { PersonalityLeaderboardTable } from "@/components/student/personality-leaderboard";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { loadPersonalityLeaderboard } from "@/lib/assessments/personality-board";
import { isPrismaUnreachable } from "@/lib/db";
import {
  paginateItems,
  parsePage,
  resolvePageSize,
} from "@/lib/pagination";
import {
  PERSONALITY_PROFILE_ENROLL_HREF,
  PERSONALITY_PROFILE_PUBLIC_HREF,
  PERSONALITY_PROFILE_RANK_HREF,
} from "@/lib/assessments/personality-profile";
import { getDefaultOrganizationId } from "@/lib/organizations/default";

/** Live board — do not prerender against the Docker/CI placeholder DATABASE_URL. */
export const dynamic = "force-dynamic";

export default async function PersonalityPublicRankPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  let rows: Awaited<ReturnType<typeof loadPersonalityLeaderboard>> = [];
  try {
    rows = await loadPersonalityLeaderboard(await getDefaultOrganizationId());
  } catch (error) {
    if (!isPrismaUnreachable(error)) throw error;
  }
  const sp = await searchParams;
  const pageSize = resolvePageSize(sp.pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = parsePage(sp.page, totalPages);
  const slice = paginateItems(rows, page, pageSize);

  return (
    <MarketingShell maxWidth="max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Assessment
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Edith Personality Profile board
      </h1>
      <p className="mt-3 text-sm text-fg-muted leading-relaxed">
        Completed sittings, ranked by aptitude and quantitative scores with a
        psyche tie-break. Identity documents are never shown.
      </p>
      <div className="mt-6">
        <PersonalityLeaderboardTable rows={slice.items} />
      </div>
      {rows.length > 0 ? (
        <div className="mt-2 border border-border">
          <Pagination
            page={slice.page}
            totalPages={slice.totalPages}
            pageSize={pageSize}
            total={rows.length}
            pathname={PERSONALITY_PROFILE_RANK_HREF}
          />
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={PERSONALITY_PROFILE_ENROLL_HREF}>
          <Button>Sit the exam</Button>
        </Link>
        <Link href={PERSONALITY_PROFILE_PUBLIC_HREF}>
          <Button variant="secondary">About the profile</Button>
        </Link>
      </div>
    </MarketingShell>
  );
}
