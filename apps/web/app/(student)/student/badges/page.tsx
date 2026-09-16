import Link from "next/link";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentBadgesPage() {
  const session = await requireStudent();
  const badges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: {
      badge: {
        select: {
          name: true,
          description: true,
          icon: true,
          iconUrl: true,
        },
      },
    },
    orderBy: { earnedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Badges"
        description="Awards and milestones granted by your instructors."
        actions={
          <Link href="/student/achievements" className="text-sm text-fg-muted underline">
            All achievements
          </Link>
        }
      />

      {badges.length === 0 ? (
        <EmptyState
          title="No badges yet"
          description="Complete courses and stand out in your cohort to earn badges."
          action={
            <Link href="/student/my-courses" className="text-sm underline">
              My courses
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((entry) => (
            <Panel key={entry.id} className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Award className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{entry.badge.name}</p>
                  <p className="text-xs text-fg-muted">
                    {entry.earnedAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
              {entry.badge.description ? (
                <p className="text-sm text-fg-muted">{entry.badge.description}</p>
              ) : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
