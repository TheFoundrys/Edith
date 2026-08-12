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
import { activityTypeLabel } from "@/lib/learning/standards";
import { cn } from "@/lib/utils";

export default async function StudentLearningCoursePage({
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
      status: "ACTIVE",
    },
  });
  if (!enrollment) notFound();

  const syllabus = await prisma.programSyllabus.findFirst({
    where: { programId: courseId, status: "PUBLISHED" },
    include: {
      program: { select: { name: true } },
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
  });
  if (!syllabus) notFound();

  const modulesWithActivities = syllabus.modules.filter(
    (m) => m.lessons.length > 0,
  );
  const activities = flattenPublishedActivities(modulesWithActivities);
  const lessonIds = activities.map((a) => a.id);

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
  const done = completedSet.size;
  const total = lessonIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const continueId = findContinueActivityId(activities, completedSet);

  return (
    <div>
      <PageHeader
        title={syllabus.program.name}
        description={syllabus.description || syllabus.title || "Course outline"}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {continueId ? (
              <Link
                href={`/student/learning/${courseId}/lessons/${continueId}`}
              >
                <Button size="sm">
                  {pct === 100 ? "Review" : "Continue"}
                </Button>
              </Link>
            ) : null}
            <Link
              href="/student/my-courses"
              className="text-sm text-fg-muted underline"
            >
              All courses
            </Link>
          </div>
        }
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-fg-muted">
            {done} of {total} activities complete
          </p>
          <Badge tone={pct === 100 ? "success" : "neutral"}>{pct}%</Badge>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
      </Panel>

      <div className="space-y-4">
        {modulesWithActivities.map((mod, index) => (
          <Panel key={mod.id}>
            <div className="border-b border-border px-4 py-4 sm:px-5">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Section {index + 1}
              </p>
              <h2 className="mt-1 font-medium">{mod.title}</h2>
              {mod.summary ? (
                <p className="mt-1 text-sm text-fg-muted">{mod.summary}</p>
              ) : null}
            </div>
            <ul className="divide-y divide-border">
              {mod.lessons.map((lesson) => {
                const complete = completedSet.has(lesson.id);
                const isContinue = lesson.id === continueId && pct < 100;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/student/learning/${courseId}/lessons/${lesson.id}`}
                      aria-current={isContinue ? "step" : undefined}
                      className={cn(
                        "flex flex-col gap-2 px-4 py-3 text-sm transition sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5",
                        isContinue
                          ? "bg-bg ring-1 ring-inset ring-border-strong"
                          : "hover:bg-bg/60",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium break-words">
                            {lesson.title}
                          </span>
                          {isContinue ? (
                            <Badge tone="info">Up next</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-fg-muted">
                          {activityTypeLabel(lesson.contentType)}
                          {lesson.durationMin != null
                            ? ` · ${lesson.durationMin} min`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs sm:self-center",
                          complete
                            ? "font-medium text-fg"
                            : "text-fg-muted",
                        )}
                      >
                        {complete ? "Completed" : "Not started"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
        {modulesWithActivities.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No published activities in this course yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
