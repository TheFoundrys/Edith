import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";

export default async function MyCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const { pending } = await searchParams;
  const session = await requireStudent();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { status: "ACTIVE" },
        { status: "PENDING", program: { requiresCrmCallback: true } },
      ],
    },
    include: {
      program: {
        include: {
          campus: true,
          syllabus: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }, { createdAt: "desc" }],
  });

  const lessonIds = enrollments.flatMap((e) =>
    e.status === "ACTIVE" && e.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(e.program.syllabus.modules).map((a) => a.id)
      : [],
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
        title="My courses"
        description="Courses you’ve enrolled in and paid for."
        actions={
          <Link href="/courses">
            <Button variant="secondary" size="sm">
              Browse catalog
            </Button>
          </Link>
        }
      />

      {pending === "crm" ? (
        <Panel className="mb-4 p-4">
          <p className="text-sm font-medium">Awaiting CRM confirmation</p>
          <p className="mt-1 text-sm text-fg-muted">
            Your enrollment was sent to CRM. Learning unlocks after they confirm.
          </p>
        </Panel>
      ) : null}

      {enrollments.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Enroll in a course to see it here."
          action={
            <Link href="/courses">
              <Button size="sm">Browse courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const awaitingCrm =
              enrollment.status === "PENDING" &&
              enrollment.program.requiresCrmCallback;
            const published = enrollment.program.syllabus?.status === "PUBLISHED";
            const activities =
              !awaitingCrm && published
                ? flattenPublishedActivities(enrollment.program.syllabus!.modules)
                : [];
            const done = activities.filter((a) => completedSet.has(a.id)).length;
            const pct =
              activities.length === 0
                ? 0
                : Math.round((done / activities.length) * 100);
            const continueId = findContinueActivityId(activities, completedSet);

            return (
              <Panel key={enrollment.id}>
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/student/my-courses/${enrollment.programId}${awaitingCrm ? "?pending=crm" : ""}`}
                        className="font-medium text-fg hover:underline"
                      >
                        {enrollment.program.title}
                      </Link>
                      <p className="mt-1 text-sm text-fg-muted">
                        {awaitingCrm
                          ? "Awaiting CRM confirmation"
                          : `${enrollment.program.campus?.name ?? "Hybrid"}${
                              published
                                ? ` · ${activities.length} activities`
                                : " · Outline coming soon"
                            }`}
                      </p>
                    </div>
                    <Badge tone={awaitingCrm ? "warning" : pct === 100 ? "success" : "neutral"}>
                      {awaitingCrm
                        ? "Pending CRM"
                        : published
                          ? `${pct}%`
                          : "Pending"}
                    </Badge>
                  </div>
                  {!awaitingCrm && published ? (
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/student/my-courses/${enrollment.programId}${awaitingCrm ? "?pending=crm" : ""}`}
                    >
                      <Button variant="secondary" size="sm">
                        Course hub
                      </Button>
                    </Link>
                    {!awaitingCrm && published ? (
                      <>
                        <Link href={`/student/learning/${enrollment.programId}`}>
                          <Button variant="secondary" size="sm">
                            Outline
                          </Button>
                        </Link>
                        {continueId ? (
                          <Link
                            href={`/student/learning/${enrollment.programId}/lessons/${continueId}`}
                          >
                            <Button size="sm">
                              {pct === 100 ? "Review" : "Continue"}
                            </Button>
                          </Link>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
