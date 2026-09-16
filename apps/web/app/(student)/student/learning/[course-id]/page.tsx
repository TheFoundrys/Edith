import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import {
  loadStudentPublishedSyllabus,
  requireActiveEnrollment,
} from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getUserCompletedLessonIds } from "@/lib/learning/progress";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";
import { LessonTypeBadge } from "@/components/learning/lesson-type-badge";
import { renderSimpleMarkdown } from "@/lib/learning/markdown";
import { lessonContentTypeMeta } from "@/lib/learning/lesson-content-type";
import { filterVisibleModules } from "@/lib/learning/syllabus-visible";
import { cn } from "@/lib/utils";

export default async function StudentLearningCoursePage({
  params,
}: {
  params: Promise<{ "course-id": string }>;
}) {
  const { "course-id": courseId } = await params;
  const session = await requireStudent();

  const enrollment = await requireActiveEnrollment(session.user.id, courseId);
  if (!enrollment) notFound();

  const syllabusView = await loadStudentPublishedSyllabus(courseId);
  if (!syllabusView) notFound();
  const syllabus = {
    title: syllabusView.title,
    description: syllabusView.description,
    program: { title: syllabusView.programTitle },
    modules: syllabusView.modules,
  };

  const visibleModules = filterVisibleModules(syllabus.modules);
  const activities = flattenPublishedActivities(visibleModules);
  const lessonIds = activities.map((a) => a.id);

  const [completedSet, lessonQuizzes] = await Promise.all([
    getUserCompletedLessonIds(session.user.id, [courseId]),
    !isCompassDatabase() && lessonIds.length
      ? prisma.lessonMcq.findMany({
          where: {
            programId: courseId,
            lessonId: { in: lessonIds },
            organizationId: session.user.organizationId,
            isActive: true,
            status: "READY",
          },
          select: { lessonId: true },
        })
      : Promise.resolve([] as { lessonId: string }[]),
  ]);
  const quizLessonIds = new Set(lessonQuizzes.map((q) => q.lessonId));
  const done = completedSet.size;
  const total = lessonIds.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const continueId = findContinueActivityId(activities, completedSet);

  return (
    <div>
      <PageHeader
        title={syllabus.program.title}
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
        {visibleModules.map((mod, index) => (
          <Panel key={mod.id}>
            <div
              className={cn(
                "px-4 py-4 sm:px-5",
                mod.lessons.length > 0 && "border-b border-border",
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Section {index + 1}
              </p>
              <h2 className="mt-1 font-medium">{mod.title}</h2>
              {mod.summary ? (
                <div className="mt-3 text-sm text-fg leading-relaxed">
                  {renderSimpleMarkdown(mod.summary)}
                </div>
              ) : null}
            </div>
            {mod.lessons.length > 0 ? (
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
                          {quizLessonIds.has(lesson.id) ? (
                            <Badge tone="neutral">Quiz</Badge>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <LessonTypeBadge
                            contentType={lesson.contentType ?? "RICH_TEXT"}
                          />
                          <span className="text-xs text-fg-muted">
                            {lessonContentTypeMeta(lesson.contentType).studentAction}
                            {lesson.durationMin != null
                              ? ` · ${lesson.durationMin} min`
                              : ""}
                          </span>
                        </div>
                        {lesson.summary ? (
                          <p className="mt-1.5 text-sm text-fg-muted leading-relaxed line-clamp-2">
                            {lesson.summary}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-xs sm:self-center",
                          complete ? "font-medium text-fg" : "text-fg-muted",
                        )}
                      >
                        {quizLessonIds.has(lesson.id)
                          ? complete
                            ? "Completed · Quiz"
                            : "Quiz available"
                          : complete
                            ? "Completed"
                            : "Not started"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            ) : null}
          </Panel>
        ))}
        {visibleModules.length === 0 ? (
          <p className="text-sm text-fg-muted">
            No published activities in this course yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
