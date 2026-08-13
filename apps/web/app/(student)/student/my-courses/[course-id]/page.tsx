import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";

export default async function MyCourseHubPage({
  params,
}: {
  params: Promise<{ "course-id": string }>;
}) {
  const { "course-id": courseId } = await params;
  const session = await requireStudent();

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      programId: courseId,
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
          department: true,
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
  });
  if (!enrollment) notFound();

  const awaitingCrm =
    enrollment.status === "PENDING" && enrollment.program.requiresCrmCallback;

  if (awaitingCrm) {
    return (
      <div>
        <PageHeader
          title={enrollment.program.title}
          description={
            enrollment.program.description ||
            `${enrollment.program.department?.name ?? "Course"} · ${
              enrollment.program.campus?.name ?? "Hybrid"
            }`
          }
          actions={
            <Link
              href="/student/my-courses"
              className="text-sm text-fg-muted underline self-center"
            >
              All courses
            </Link>
          }
        />
        <Panel className="p-5 space-y-3">
          <Badge tone="warning">Pending CRM</Badge>
          <p className="text-sm font-medium">Awaiting CRM confirmation</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            Your enrollment request was sent to CRM
            {enrollment.crmRequestedAt
              ? ` on ${enrollment.crmRequestedAt.toLocaleString()}`
              : ""}
            . Learning unlocks after they approve.
          </p>
          {enrollment.crmLeadId ? (
            <p className="text-xs text-fg-muted">
              CRM lead: {enrollment.crmLeadId}
            </p>
          ) : null}
        </Panel>
      </div>
    );
  }

  const published = enrollment.program.syllabus?.status === "PUBLISHED";
  const modules = published ? enrollment.program.syllabus!.modules : [];
  const activities = flattenPublishedActivities(modules);
  const progress = activities.length
    ? await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lessonId: { in: activities.map((a) => a.id) },
          completedAt: { not: null },
        },
      })
    : [];
  const completedSet = new Set(progress.map((p) => p.lessonId));
  const done = completedSet.size;
  const pct =
    activities.length === 0 ? 0 : Math.round((done / activities.length) * 100);
  const continueId = findContinueActivityId(activities, completedSet);

  return (
    <div>
      <PageHeader
        title={enrollment.program.title}
        description={
          enrollment.program.description ||
          `${enrollment.program.department?.name ?? "Course"} · ${
            enrollment.program.campus?.name ?? "Hybrid"
          }`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {published && continueId ? (
              <Link
                href={`/student/learning/${courseId}/lessons/${continueId}`}
              >
                <Button size="sm">{pct === 100 ? "Review" : "Continue learning"}</Button>
              </Link>
            ) : null}
            {published ? (
              <Link href={`/student/learning/${courseId}`}>
                <Button variant="secondary" size="sm">
                  Full outline
                </Button>
              </Link>
            ) : null}
            <Link href="/student/my-courses" className="text-sm text-fg-muted underline self-center">
              All courses
            </Link>
          </div>
        }
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-fg-muted">
            {done} of {activities.length} activities complete
          </p>
          <Badge tone={pct === 100 ? "success" : "neutral"}>{pct}%</Badge>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </Panel>

      {!published ? (
        <p className="text-sm text-fg-muted">
          The learning outline for this course isn’t published yet.
        </p>
      ) : (
        <div className="space-y-3">
          {modules
            .filter((m) => m.lessons.length > 0)
            .map((mod, index) => (
              <Panel key={mod.id} className="p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Section {index + 1}
                </p>
                <h2 className="mt-1 font-medium">{mod.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {mod.lessons.filter((l) => completedSet.has(l.id)).length} of{" "}
                  {mod.lessons.length} complete
                </p>
              </Panel>
            ))}
        </div>
      )}
    </div>
  );
}
