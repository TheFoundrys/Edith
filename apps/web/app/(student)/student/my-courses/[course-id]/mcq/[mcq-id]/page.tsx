import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { submitCourseMcqAttemptAction } from "@/lib/actions/course-mcq";
import { getOrCreateCourseMcqAttempt } from "@/lib/actions/course-mcq-session";
import { resolveProgramById } from "@/lib/compass/program-bridge";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function CourseMcqTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ "course-id": string; "mcq-id": string }>;
  searchParams: Promise<{ result?: string; retake?: string }>;
}) {
  const { "course-id": courseId, "mcq-id": mcqId } = await params;
  const { result, retake } = await searchParams;
  const session = await requireStudent();
  if (isCompassDatabase()) notFound();
  const mcqBase = `/student/my-courses/${courseId}/mcq/${mcqId}`;

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: courseId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    include: {
      program: { select: { id: true, title: true, slug: true } },
    },
  });
  if (!enrollment) {
    const program = await resolveProgramById(courseId);
    redirect(`/enroll/${program?.slug ?? courseId}`);
  }

  const mcq = await prisma.courseMcq.findFirst({
    where: {
      id: mcqId,
      programId: courseId,
      organizationId: session.user.organizationId,
      isActive: true,
      status: "READY",
    },
  });
  if (!mcq) notFound();

  if (retake === "1") {
    await prisma.courseAssessmentAttempt.deleteMany({
      where: {
        userId: session.user.id,
        courseMcqId: mcq.id,
        submittedAt: null,
      },
    });
    redirect(mcqBase);
  }

  const latestAttempt = await prisma.courseAssessmentAttempt.findFirst({
    where: { courseMcqId: mcq.id, userId: session.user.id },
    orderBy: { submittedAt: "desc" },
  });

  const showResults = result === "submitted" && latestAttempt?.submittedAt;
  const sessionData = showResults
    ? null
    : await getOrCreateCourseMcqAttempt({
        userId: session.user.id,
        organizationId: session.user.organizationId,
        programId: courseId,
        courseMcq: mcq,
      });

  const displayQuestions =
    sessionData && "displayQuestions" in sessionData
      ? (sessionData.displayQuestions ?? [])
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={mcq.title ?? "Course assessment"}
        description={`${enrollment.program.title} · ${mcq.totalQuestions} random questions per attempt`}
        actions={
          <Link
            href={`/student/my-courses/${courseId}`}
            className="text-sm text-fg-muted underline"
          >
            Back to course
          </Link>
        }
      />

      {!showResults ? (
        <Panel className="p-4">
          <p className="text-sm text-fg-muted">
            Questions and answer options are randomized for your attempt. Each retake
            draws a new set from the question bank.
          </p>
        </Panel>
      ) : null}

      {showResults && latestAttempt ? (
        <Panel className="p-5 space-y-3">
          <Badge tone={latestAttempt.passed ? "success" : "warning"}>
            {latestAttempt.passed ? "Passed" : "Needs improvement"}
          </Badge>
          <p className="text-sm">
            Score: {latestAttempt.correctAnswers}/{latestAttempt.totalQuestions} (
            {Math.round(latestAttempt.percentage)}%)
          </p>
          <Link href={`${mcqBase}?retake=1`}>
            <Button size="sm" variant="secondary">
              Retake with new random questions
            </Button>
          </Link>
        </Panel>
      ) : null}

      {!showResults && sessionData && "error" in sessionData ? (
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">{sessionData.error}</p>
        </Panel>
      ) : null}

      {!showResults && displayQuestions.length > 0 && sessionData && "attemptId" in sessionData ? (
        <form action={submitCourseMcqAttemptAction}>
          <input type="hidden" name="attemptId" value={sessionData.attemptId} />
          <input type="hidden" name="programId" value={courseId} />
          <input type="hidden" name="mcqId" value={mcqId} />
          <div className="space-y-4">
            {displayQuestions.map((question, index) => (
              <Panel key={question.id} className="p-5 space-y-3">
                <p className="text-sm font-medium">
                  {index + 1}. {question.prompt}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={`${question.id}-${optionIndex}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="radio"
                        name={`answer_${question.id}`}
                        value={optionIndex}
                        required
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
          <div className="mt-4">
            <Button type="submit">Submit assessment</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
