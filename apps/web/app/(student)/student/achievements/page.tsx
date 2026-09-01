import Link from "next/link";
import { Award, Flame, Medal } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { getStudentAchievements } from "@/lib/learning/student-achievements";

const ICONS = {
  certificate: Award,
  streak: Flame,
  performance: Medal,
} as const;

export default async function StudentAchievementsPage() {
  const session = await requireStudent();
  const items = await getStudentAchievements(session.user.id);

  return (
    <div>
      <PageHeader
        title="Achievements"
        description="Certificates, streaks, and learning milestones from your activity."
        actions={
          <Link href="/student/dashboard" className="text-sm text-fg-muted underline">
            Back to dashboard
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No achievements yet"
          description="Complete lessons and earn certificates to unlock achievements."
          action={
            <Link href="/student/my-courses" className="text-sm underline">
              My courses
            </Link>
          }
        />
      ) : (
        <Panel className="divide-y divide-border">
          <ul>
            {items.map((item) => {
              const Icon = ICONS[item.kind];
              const content = (
                <>
                  <span
                    className={`dash-achievement-icon dash-achievement-icon-${item.kind}`}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{item.title}</span>
                    <span className="block text-sm text-fg-muted">{item.subtitle}</span>
                  </span>
                  <span className="text-sm text-fg-muted whitespace-nowrap">
                    {item.whenLabel}
                  </span>
                </>
              );

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-bg transition-colors"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-4 px-5 py-4">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}
