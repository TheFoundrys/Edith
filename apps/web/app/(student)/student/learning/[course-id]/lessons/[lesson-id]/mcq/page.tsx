import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LessonMcqForm } from "@/components/student/lesson-mcq-form";
import { LessonMcqReview } from "@/components/student/lesson-mcq-review";
import {
  getOrCreateLessonMcqAttempt,
  parseLessonMcqUserAnswers,
  readLessonMcqPaper,
} from "@/lib/actions/lesson-mcq-session";
import { requireStudent } from "@/lib/auth/session";
import { requireStudentEnrollmentAccess } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { reviewQuestionsForPaper } from "@/lib/assessments/course-mcq-paper";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function LessonMcqPage({
  params,
  searchParams,
}: {
  params: Promise<{ "course-id": string; "lesson-id": string }>;
  searchParams: Promise<{ result?: string; retake?: string; attempt?: string }>;
}) {
  const { "course-id": courseId, "lesson-id": lessonId } = await params;
  const { retake, attempt } = await searchParams;
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
      isPublished: true,
      module: { syllabus: { programId: courseId, status: "PUBLISHED" } },
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
  if (!mcq) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lesson quiz"
          description={lesson.title}
          actions={
            <Link
              href={`/student/learning/${courseId}/lessons/${lessonId}`}
              className="text-sm text-fg-muted underline"
            >
              Back to lesson
            </Link>
          }
        />
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">
            This lesson quiz is not published yet. Ask your instructor to add
            questions and publish it.
          </p>
        </Panel>
      </div>
    );
  }

  const quizHref = `/student/learning/${courseId}/lessons/${lessonId}/mcq`;

  if (retake === "1") {
    await prisma.lessonMcqAttempt.deleteMany({
      where: {
        userId: session.user.id,
        lessonMcqId: mcq.id,
        submittedAt: null,
      },
    });
    redirect(`${quizHref}?attempt=new`);
  }

  const [inProgress, latestSubmitted] = await Promise.all([
    prisma.lessonMcqAttempt.findFirst({
      where: {
        lessonMcqId: mcq.id,
        userId: session.user.id,
        submittedAt: null,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.lessonMcqAttempt.findFirst({
      where: {
        lessonMcqId: mcq.id,
        userId: session.user.id,
        submittedAt: { not: null },
      },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const showResults = Boolean(
    latestSubmitted && !inProgress && attempt !== "new",
  );
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

  const bank = parseMcqQuestions(mcq.questions);
  const paper = latestSubmitted
    ? readLessonMcqPaper(latestSubmitted.answers)
    : null;
  const reviewQuestions =
    showResults && paper
      ? reviewQuestionsForPaper(
          bank,
          paper,
          parseLessonMcqUserAnswers(latestSubmitted?.userAnswers),
        )
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lesson quiz"
        description={`${lesson.title} · randomized each attempt · pass ${mcq.passingScore || 70}%`}
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
            Answer every question. A passing score marks this lesson complete.
            Questions and options are shuffled for your attempt.
          </p>
        </Panel>
      ) : null}

      {showResults && latestSubmitted ? (
        <Panel className="p-5 space-y-3">
          <Badge tone={latestSubmitted.passed ? "success" : "warning"}>
            {latestSubmitted.passed ? "Passed · lesson marked complete" : "Try again"}
          </Badge>
          <p className="text-sm">
            Score: {latestSubmitted.correctAnswers}/{latestSubmitted.totalQuestions}{" "}
            ({Math.round(latestSubmitted.score ?? 0)}%)
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`${quizHref}?retake=1`}>
              <Button size="sm" variant="secondary">
                Retake with new random order
              </Button>
            </Link>
            <Link href={`/student/learning/${courseId}/lessons/${lessonId}`}>
              <Button size="sm">Back to lesson</Button>
            </Link>
          </div>
        </Panel>
      ) : null}

      {showResults ? <LessonMcqReview questions={reviewQuestions} /> : null}

      {!showResults && sessionData && "error" in sessionData ? (
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">{sessionData.error}</p>
        </Panel>
      ) : null}

      {!showResults &&
      displayQuestions.length > 0 &&
      sessionData &&
      "attemptId" in sessionData ? (
        <LessonMcqForm
          attemptId={sessionData.attemptId ?? ""}
          lessonId={lessonId}
          programId={courseId}
          questions={displayQuestions}
        />
      ) : null}
    </div>
  );
}
