import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import {
  loadEnrollmentWithPayments,
  loadStudentPublishedSyllabus,
} from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { getUserCompletedLessonIds } from "@/lib/learning/progress";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";
import {
  afterEnrollmentHref,
  isPersonalityProfileProgram,
} from "@/lib/assessments/personality-profile";
import { LessonTypeBadge } from "@/components/learning/lesson-type-badge";
import { renderSimpleMarkdown } from "@/lib/learning/markdown";
import { lessonContentTypeMeta } from "@/lib/learning/lesson-content-type";
import { filterVisibleModules } from "@/lib/learning/syllabus-visible";
import { cn } from "@/lib/utils";

export default async function MyCourseHubPage({
  params,
}: {
  params: Promise<{ "course-id": string }>;
}) {
  const { "course-id": courseId } = await params;
  const session = await requireStudent();

  const enrollmentRow = await loadEnrollmentWithPayments(
    session.user.id,
    courseId,
  );
  if (
    !enrollmentRow ||
    !["ACTIVE", "PENDING"].includes(enrollmentRow.status)
  ) {
    notFound();
  }

  const syllabusView = await loadStudentPublishedSyllabus(courseId);
  const enrollment = {
    id: enrollmentRow.id,
    status: enrollmentRow.status,
    programId: courseId,
    crmRequestedAt: null as Date | null,
    crmLeadId: null as string | null,
    payments: enrollmentRow.payments,
    program: {
      ...enrollmentRow.program,
      campus: null as { name: string } | null,
      department: null as { name: string } | null,
      description: enrollmentRow.program.description,
      syllabus: syllabusView
        ? {
            status: "PUBLISHED" as const,
            title: syllabusView.title,
            description: syllabusView.description,
            modules: syllabusView.modules,
          }
        : null,
    },
  };

  if (isPersonalityProfileProgram(enrollment.program)) {
    redirect(afterEnrollmentHref(enrollment.program));
  }

  const awaitingCrm =
    enrollment.status === "PENDING" && enrollment.program.requiresCrmCallback;
  const awaitingPayment =
    enrollment.status === "PENDING" &&
    !enrollment.program.requiresCrmCallback &&
    !enrollment.payments.some((payment) =>
      ["PAID", "SUCCESS", "COMPLETED"].includes(payment.status),
    );

  if (awaitingPayment) {
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
          <Badge tone="warning">Payment pending</Badge>
          <p className="text-sm font-medium">Complete payment to unlock learning</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            Your enrollment is reserved. Pay the tuition fee to access the course
            outline and lessons.
          </p>
          <Link href={`/checkout?course=${encodeURIComponent(enrollment.program.slug)}`}>
            <Button size="sm">Complete payment</Button>
          </Link>
        </Panel>
      </div>
    );
  }

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

  const [completedSet, courseMcqs] = await Promise.all([
    getUserCompletedLessonIds(session.user.id, [courseId]),
    !isCompassDatabase()
      ? prisma.courseMcq.findMany({
          where: {
            programId: courseId,
            organizationId: session.user.organizationId,
            isActive: true,
            status: "READY",
          },
          orderBy: [{ setNumber: "asc" }, { updatedAt: "desc" }],
        })
      : Promise.resolve([]),
  ]);
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

      {courseMcqs.length > 0 ? (
        <Panel className="mb-6 p-4 space-y-3">
          <p className="text-sm font-medium">Course assessments</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-fg-muted">
              {courseMcqs.length === 1
                ? `${courseMcqs[0]!.title ?? "Question bank"} · randomized each attempt`
                : `${courseMcqs.length} sets · random set + shuffled questions each attempt`}
            </p>
            <Link
              href={
                courseMcqs.length === 1
                  ? `/student/my-courses/${courseId}/mcq/${courseMcqs[0]!.id}`
                  : `/student/my-courses/${courseId}/mcq`
              }
            >
              <Button size="sm">Take assessment</Button>
            </Link>
          </div>
        </Panel>
      ) : null}

      {!published ? (
        <p className="text-sm text-fg-muted">
          The learning outline for this course isn’t published yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filterVisibleModules(modules).map((mod, index) => (
              <Panel key={mod.id} className="p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Section {index + 1}
                </p>
                <h2 className="mt-1 font-medium">{mod.title}</h2>
                {mod.summary ? (
                  <div className="mt-3 text-sm text-fg leading-relaxed">
                    {renderSimpleMarkdown(mod.summary)}
                  </div>
                ) : null}
                {mod.lessons.length > 0 ? (
                  <>
                    <p className="mt-2 text-sm text-fg-muted">
                      {mod.lessons.filter((l) => completedSet.has(l.id)).length} of{" "}
                      {mod.lessons.length} activities complete
                    </p>
                    <ul className="mt-3 divide-y divide-border rounded-[var(--radius-sm)] border border-border">
                      {mod.lessons.map((lesson) => {
                        const complete = completedSet.has(lesson.id);
                        const isContinue = lesson.id === continueId && pct < 100;
                        return (
                          <li key={lesson.id}>
                            <Link
                              href={`/student/learning/${courseId}/lessons/${lesson.id}`}
                              className={cn(
                                "flex flex-col gap-2 px-3 py-2.5 text-sm transition sm:flex-row sm:items-center sm:justify-between",
                                isContinue ? "bg-bg-elevated" : "hover:bg-bg/60",
                              )}
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium">{lesson.title}</span>
                                  {isContinue ? (
                                    <Badge tone="info">Up next</Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <LessonTypeBadge contentType={lesson.contentType} />
                                  <span className="text-xs text-fg-muted">
                                    {lessonContentTypeMeta(lesson.contentType).studentAction}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={cn(
                                  "text-xs sm:shrink-0",
                                  complete ? "font-medium text-fg" : "text-fg-muted",
                                )}
                              >
                                {complete ? "Completed" : "Not started"}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : null}
              </Panel>
            ))}
        </div>
      )}
    </div>
  );
}
