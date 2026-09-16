import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { submitLessonMcqAttemptAction } from "@/lib/actions/lesson-mcq";
import { getOrCreateLessonMcqAttempt } from "@/lib/actions/lesson-mcq-session";
import { requireStudent } from "@/lib/auth/session";
import { requireStudentEnrollmentAccess } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function LessonMcqPage({
  params,
  searchParams,
}: {
  params: Promise<{ "course-id": string; "lesson-id": string }>;
  searchParams: Promise<{ result?: string; retake?: string }>;
}) {
  const { "course-id": courseId, "lesson-id": lessonId } = await params;
  const { result, retake } = await searchParams;
  const session = await requireStudent();

  const enrollment = await requireStudentEnrollmentAccess(
    session.user.id,
    courseId,
    ["ACTIVE", "COMPLETED"],
  );
  if (!enrollment) redirect(`/student/learning/${courseId}`);
  if (isCompassDatabase()) notFound();

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      module: { syllabus: { programId: courseId } },
    },
    select: { id: true, title: true },
  });
  if (!lesson) notFound();

  const mcq = await prisma.lessonMcq.findFirst({
    where: {
      lessonId,
      programId: courseId,
      organizationId: session.user.organizationId,
      isActive: true,
      status: "READY",
    },
  });
  if (!mcq) notFound();

  if (retake === "1") {
    await prisma.lessonMcqAttempt.deleteMany({
      where: {
        userId: session.user.id,
        lessonMcqId: mcq.id,
        submittedAt: null,
      },
    });
    redirect(`/student/learning/${courseId}/lessons/${lessonId}/mcq`);
  }

  const latestAttempt = await prisma.lessonMcqAttempt.findFirst({
    where: { lessonMcqId: mcq.id, userId: session.user.id },
    orderBy: { submittedAt: "desc" },
  });

  const showResults = result === "submitted" && latestAttempt?.submittedAt;
  const sessionData = showResults
    ? null
    : await getOrCreateLessonMcqAttempt({
        userId: session.user.id,
        lessonMcq: mcq,
        lessonId,
      });

  const displayQuestions =
    sessionData && "displayQuestions" in sessionData
      ? (sessionData.displayQuestions ?? [])
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson quiz"
        description={`${lesson.title} · randomized each attempt`}
        actions={
          <Link
            href={`/student/learning/${courseId}/lessons/${lessonId}`}
            className="text-sm text-fg-muted underline"
          >
            Back to lesson
          </Link>
        }
      />

      {!showResults ? (
        <Panel className="p-4">
          <p className="text-sm text-fg-muted">
            Questions and answer options are shuffled for your attempt.
          </p>
        </Panel>
      ) : null}

      {showResults && latestAttempt ? (
        <Panel className="p-5 space-y-3">
          <Badge tone={latestAttempt.passed ? "success" : "warning"}>
            {latestAttempt.passed ? "Passed" : "Try again"}
          </Badge>
          <p className="text-sm">
            Score: {latestAttempt.correctAnswers}/{latestAttempt.totalQuestions}{" "}
            ({Math.round(latestAttempt.score ?? 0)}%)
          </p>
          <Link
            href={`/student/learning/${courseId}/lessons/${lessonId}/mcq?retake=1`}
          >
            <Button size="sm" variant="secondary">
              Retake with new random order
            </Button>
          </Link>
        </Panel>
      ) : null}

      {!showResults && sessionData && "error" in sessionData ? (
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">{sessionData.error}</p>
        </Panel>
      ) : null}

      {!showResults &&
      displayQuestions.length > 0 &&
      sessionData &&
      "attemptId" in sessionData ? (
        <form action={submitLessonMcqAttemptAction}>
          <input type="hidden" name="attemptId" value={sessionData.attemptId} />
          <input type="hidden" name="lessonId" value={lessonId} />
          <input type="hidden" name="programId" value={courseId} />
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
            <Button type="submit">Submit quiz</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
