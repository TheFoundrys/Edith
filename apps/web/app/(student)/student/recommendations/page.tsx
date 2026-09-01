import Link from "next/link";
import { DashboardRecommendedCard } from "@/components/student/dashboard-recommended-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { getCourseRecommendationsForUser } from "@/lib/learning/recommendations";

export default async function StudentRecommendationsPage() {
  const session = await requireStudent();
  const recommended = await getCourseRecommendationsForUser(session.user.id, {
    organizationId: session.user.organizationId,
    limit: 24,
  });

  return (
    <div>
      <PageHeader
        title="Recommended for you"
        description="Programmes picked from your learning history and interests."
        actions={
          <Link href="/student/dashboard" className="text-sm text-fg-muted underline">
            Back to dashboard
          </Link>
        }
      />

      {recommended.length === 0 ? (
        <EmptyState
          title="No recommendations right now"
          description="You're enrolled in all available programmes, or the catalogue is still growing."
          action={
            <Link href="/student/enroll" className="text-sm underline">
              Browse courses
            </Link>
          }
        />
      ) : (
        <div className="cm-grid-3">
          {recommended.map((course) => (
            <DashboardRecommendedCard
              key={course.id}
              title={course.title}
              href={course.href}
              category={course.category}
              durationLabel={course.durationLabel}
              reason={course.reason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
