import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { DashboardCourseTrack } from "@/components/student/dashboard-course-track";
import { DashboardRecommendedCard } from "@/components/student/dashboard-recommended-card";
import {
  ProgramCatalogCard,
  ProgramCatalogGrid,
  ProgramCatalogGridItem,
} from "@/components/programs/program-catalog-card";
import { Button } from "@/components/ui/button";
import { loadPublishedCatalogPrograms } from "@/lib/catalog/service";
import { getCourseRecommendationsForUser } from "@/lib/learning/recommendations";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentEnrollPage() {
  const session = await requireStudent();

  const [courses, enrollments, recommended] = await Promise.all([
    loadPublishedCatalogPrograms({
      organizationId: session.user.organizationId,
    }),
    prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
        status: "ACTIVE",
      },
      select: { programId: true },
    }),
    getCourseRecommendationsForUser(session.user.id, {
      organizationId: session.user.organizationId,
      limit: 6,
    }),
  ]);

  const enrolled = new Set(enrollments.map((e) => e.programId));
  const available = courses.filter((c) => !enrolled.has(c.id));

  return (
    <div className="space-y-8 courses-theme">
      <PageHeader
        title="Enroll"
        description="Choose a course to join — free courses unlock immediately; paid ones continue to Payment."
      />

      {recommended.length > 0 ? (
        <DashboardCourseTrack title="Recommended for You">
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
        </DashboardCourseTrack>
      ) : null}

      {available.length === 0 ? (
        <EmptyState
          title={courses.length === 0 ? "No courses yet" : "You're all set"}
          description={
            courses.length === 0
              ? "Published courses will appear here when the catalog is ready."
              : "You're enrolled in every published course. Open My Courses to learn."
          }
          action={
            <Link href="/student/my-courses">
              <Button size="sm">My courses</Button>
            </Link>
          }
        />
      ) : (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-fg">
              All available courses
            </h2>
            <Link href="/courses" className="courses-cta text-sm">
              Browse full catalogue →
            </Link>
          </div>
          <ProgramCatalogGrid>
            {available.map((course) => (
              <ProgramCatalogGridItem key={course.id}>
                <ProgramCatalogCard
                  program={course}
                  href={`/courses/${course.slug}`}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/enroll/${course.slug}`}>
                        <Button size="sm">Enroll</Button>
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="courses-cta self-center"
                      >
                        View course →
                      </Link>
                    </div>
                  }
                />
              </ProgramCatalogGridItem>
            ))}
          </ProgramCatalogGrid>
        </section>
      )}
    </div>
  );
}
