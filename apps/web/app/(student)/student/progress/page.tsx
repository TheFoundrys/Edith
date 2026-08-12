import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { flattenPublishedActivities } from "@/lib/learning/outline";

export default async function StudentProgressPage() {
  const session = await requireStudent();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: {
      program: {
        include: {
          syllabus: {
            include: {
              modules: {
                orderBy: { sortOrder: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const withSyllabus = enrollments.filter(
    (e) => e.program.syllabus?.status === "PUBLISHED",
  );
  const lessonIds = withSyllabus.flatMap((e) =>
    flattenPublishedActivities(e.program.syllabus!.modules).map((a) => a.id),
  );
  const progress = lessonIds.length
    ? await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: lessonIds },
          completedAt: { not: null },
        },
      })
    : [];
  const completedSet = new Set(progress.map((p) => p.lessonId));

  return (
    <div>
      <PageHeader
        title="Progress"
        description="Completion across all of your enrolled courses."
      />

      {withSyllabus.length === 0 ? (
        <EmptyState
          title="No progress yet"
          description="Enroll in a course with a published outline to track progress."
          action={
            <Link href="/courses" className="text-sm underline">
              Browse courses
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {withSyllabus.map((enrollment) => {
            const activities = flattenPublishedActivities(
              enrollment.program.syllabus!.modules,
            );
            const done = activities.filter((a) => completedSet.has(a.id)).length;
            const pct =
              activities.length === 0
                ? 0
                : Math.round((done / activities.length) * 100);
            return (
              <Panel key={enrollment.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/student/learning/${enrollment.programId}`}
                      className="font-medium hover:underline"
                    >
                      {enrollment.program.name}
                    </Link>
                    <p className="mt-1 text-sm text-fg-muted">
                      {done} / {activities.length} activities
                    </p>
                  </div>
                  <Badge tone={pct === 100 ? "success" : "neutral"}>{pct}%</Badge>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
