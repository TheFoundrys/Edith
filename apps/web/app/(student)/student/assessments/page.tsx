import Link from "next/link";
import { EngagementQueue } from "@/components/student/engagement-queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { getStudentEngagementItems } from "@/lib/learning/student-engagement";
import { findCompassCliftonAssessment } from "@/lib/compass/clifton-assessment";
import { requireStudent } from "@/lib/auth/session";
import { loadStudentEnrollments } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_SLUG,
  personalityProgress,
  type PersonalityResponses,
} from "@/lib/assessments/personality-profile";
import { hasPaidPersonalityExamAccess } from "@/lib/assessments/personality-access";
import {
  isIdentityComplete,
  isResumeComplete,
} from "@/lib/assessments/personality-kyc";

export default async function StudentAssessmentsPage() {
  const session = await requireStudent();
  const compass = isCompassDatabase();

  const enrollments = compass
    ? (await loadStudentEnrollments(session.user.id, ["ACTIVE"])).map((e) => ({
        programId: e.programId,
        program: { slug: e.program.slug, title: e.program.title },
      }))
    : await prisma.enrollment.findMany({
        where: { userId: session.user.id, status: "ACTIVE" },
        select: {
          programId: true,
          program: { select: { slug: true, title: true } },
        },
      });
  const programIds = enrollments.map((e) => e.programId);
  const personalityEnrollment = enrollments.find(
    (e) => e.program.slug === PERSONALITY_PROFILE_SLUG,
  );
  const personalityProgramId = personalityEnrollment?.programId;

  const [assignments, quizzes, courseMcqs, lessonMcqs, personalityAttempt, examPaid, engagementItems] =
    await Promise.all([
    !compass && programIds.length
      ? prisma.assignment.findMany({
          where: { programId: { in: programIds }, isPublished: true },
          include: {
            program: { select: { title: true } },
            submissions: {
              where: { userId: session.user.id },
              take: 1,
            },
          },
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    !compass && programIds.length
      ? prisma.quiz.findMany({
          where: { programId: { in: programIds }, status: "PUBLISHED" },
          include: {
            program: { select: { title: true } },
            _count: { select: { questions: true } },
            attempts: {
              where: { userId: session.user.id },
              orderBy: { submittedAt: "desc" },
              take: 1,
            },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !compass && programIds.length
      ? prisma.courseMcq.findMany({
          where: {
            programId: { in: programIds },
            organizationId: session.user.organizationId,
            isActive: true,
            status: "READY",
          },
          include: { program: { select: { title: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    !compass && programIds.length
      ? prisma.lessonMcq.findMany({
          where: {
            programId: { in: programIds },
            organizationId: session.user.organizationId,
            isActive: true,
            status: "READY",
          },
          include: {
            program: { select: { title: true } },
            lesson: { select: { id: true, title: true } },
          },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    compass
      ? findCompassCliftonAssessment(session.user.id)
      : prisma.cliftonAssessment.findFirst({
          where: {
            userId: session.user.id,
            organizationId: session.user.organizationId,
          },
          orderBy: { createdAt: "desc" },
          select: { responses: true, status: true, aiMetadata: true },
        }),
    personalityProgramId
      ? hasPaidPersonalityExamAccess({
          userId: session.user.id,
          programId: personalityProgramId,
        })
      : Promise.resolve(false),
    getStudentEngagementItems(
      session.user.id,
      session.user.organizationId,
      12,
    ),
  ]);

  const personality = personalityProgress(
    (personalityAttempt?.responses ?? {}) as PersonalityResponses,
  );
  const kyc =
    personalityAttempt?.aiMetadata &&
    typeof personalityAttempt.aiMetadata === "object" &&
    !Array.isArray(personalityAttempt.aiMetadata)
      ? (personalityAttempt.aiMetadata as { kyc?: unknown }).kyc
      : undefined;
  const identityComplete = isIdentityComplete(kyc);
  const resumeComplete = isResumeComplete(kyc);
  const personalityStatus = personalityEnrollment
    ? personality.done > 0
      ? `${personality.done} of ${personality.total} questions complete`
      : examPaid
        ? `Exam unlocked · ${personality.done} of ${personality.total} questions answered`
        : !identityComplete
          ? "Step 1 of 3 — save your details to continue."
          : !resumeComplete
            ? "Step 2 of 3 — upload your resume."
            : "Step 3 of 3 — pay ₹3,500 + GST to sit the exam."
    : "Save your details, upload a resume, then pay for the mandatory ₹3,500 sitting.";

  const empty =
    assignments.length === 0 &&
    quizzes.length === 0 &&
    courseMcqs.length === 0 &&
    lessonMcqs.length === 0;

  return (
    <div>
      <PageHeader
        title="Assignments & Quizzes"
        description="Weekly assignments, module check-ins, and lesson quizzes to keep you engaged throughout the course."
      />

      {engagementItems.length > 0 ? (
        <Panel className="p-0 overflow-hidden">
          <EngagementQueue
            items={engagementItems}
            title="Up next for you"
            viewAllHref="/student/assessments"
          />
        </Panel>
      ) : null}

      {empty ? (
        <EmptyState
          title="No course assessments yet"
          description="Enroll in a course for assignments and quizzes. You can start the Personality Profile without a course enrollment."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={PERSONALITY_PROFILE_HREF}>
                <Button size="sm">Start Personality Profile</Button>
              </Link>
              <Link href="/student/enroll">
                <Button size="sm" variant="secondary">
                  Enroll in a course
                </Button>
              </Link>
            </div>
          }
        />
      ) : null}

      <div className="space-y-[var(--grid-pad)]">
          <section>
              <h2 className="mb-[var(--grid-gap)] font-display text-xl text-fg">
                Personality profile
              </h2>
              <article className="peak-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                  Aadhaar / PAN · Resume · ₹3,500 exam
                </p>
                <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                  <Link
                    href={
                      personality.pct === 100
                        ? `${PERSONALITY_PROFILE_HREF}/report`
                        : PERSONALITY_PROFILE_HREF
                    }
                    className="hover:underline underline-offset-2"
                  >
                    Edith Personality Profile
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-fg-muted">
                  {personalityStatus}
                </p>
                <div className="mt-auto pt-[var(--grid-pad)]">
                  <Link
                    href={
                      personality.pct === 100
                        ? `${PERSONALITY_PROFILE_HREF}/report`
                        : PERSONALITY_PROFILE_HREF
                    }
                  >
                    <Button size="sm">
                      {personality.pct === 100
                        ? "View scores"
                        : personalityEnrollment
                          ? "Continue"
                          : "Start"}
                    </Button>
                  </Link>
                </div>
              </article>
            </section>

          {empty ? null : (
            <>
          <section>
            <div className="mb-[var(--grid-gap)] flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-fg">Assignments</h2>
              <Link
                href="/student/assignments"
                className="text-xs text-fg-muted underline underline-offset-2"
              >
                View all
              </Link>
            </div>
            {assignments.length === 0 ? (
              <p className="text-sm text-fg-muted">No assignments published.</p>
            ) : (
              <div className="cm-grid">
                {assignments.map((assignment) => {
                  const submission = assignment.submissions[0];
                  return (
                    <article key={assignment.id} className="peak-card">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                          {assignment.program.title}
                        </p>
                        <Badge tone={submission ? "success" : "warning"}>
                          {submission ? "Submitted" : "Open"}
                        </Badge>
                      </div>
                      <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                        <Link
                          href={`/student/assignments/${assignment.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {assignment.title}
                        </Link>
                      </h3>
                      {assignment.dueAt ? (
                        <p className="mt-2 text-sm text-fg-muted">
                          Due {assignment.dueAt.toLocaleDateString()}
                        </p>
                      ) : null}
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <Link href={`/student/assignments/${assignment.id}`}>
                          <Button size="sm">
                            {submission ? "View" : "Start"}
                          </Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {courseMcqs.length > 0 ? (
            <section>
              <h2 className="mb-[var(--grid-gap)] font-display text-xl text-fg">
                AI course assessments
              </h2>
              <div className="cm-grid">
                {Array.from(
                  courseMcqs.reduce((map, mcq) => {
                    if (!map.has(mcq.programId)) map.set(mcq.programId, mcq);
                    return map;
                  }, new Map<string, (typeof courseMcqs)[number]>()),
                ).map(([programId, mcq]) => {
                  const setCount = courseMcqs.filter(
                    (row) => row.programId === programId,
                  ).length;
                  return (
                    <article key={programId} className="peak-card">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                        {mcq.program.title}
                      </p>
                      <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                        Course MCQ
                      </h3>
                      <p className="mt-2 text-sm text-fg-muted">
                        {setCount > 1
                          ? `${setCount} sets · random set each attempt`
                          : "Randomized questions each attempt"}
                      </p>
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <Link
                          href={
                            setCount > 1
                              ? `/student/my-courses/${programId}/mcq`
                              : `/student/my-courses/${programId}/mcq/${mcq.id}`
                          }
                        >
                          <Button size="sm">Take assessment</Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {lessonMcqs.length > 0 ? (
            <section>
              <h2 className="mb-[var(--grid-gap)] font-display text-xl text-fg">
                Lesson quizzes
              </h2>
              <div className="cm-grid">
                {lessonMcqs.map((mcq) => (
                  <article key={mcq.id} className="peak-card">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                      {mcq.program.title}
                    </p>
                    <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                      {mcq.lesson.title}
                    </h3>
                    <p className="mt-2 text-sm text-fg-muted">Lesson quiz</p>
                    <div className="mt-auto pt-[var(--grid-pad)]">
                      <Link
                        href={`/student/learning/${mcq.programId}/lessons/${mcq.lessonId}/mcq`}
                      >
                        <Button size="sm">Take quiz</Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-[var(--grid-gap)] flex items-end justify-between gap-3">
              <h2 className="font-display text-xl text-fg">Quizzes</h2>
              <Link
                href="/student/quizzes"
                className="text-xs text-fg-muted underline underline-offset-2"
              >
                View all
              </Link>
            </div>
            {quizzes.length === 0 ? (
              <p className="text-sm text-fg-muted">No quizzes published.</p>
            ) : (
              <div className="cm-grid">
                {quizzes.map((quiz) => {
                  const attempt = quiz.attempts[0];
                  return (
                    <article key={quiz.id} className="peak-card">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                          {quiz.program.title}
                        </p>
                        <Badge tone={attempt ? "success" : "neutral"}>
                          {attempt
                            ? `Score ${attempt.score ?? "—"}`
                            : `${quiz._count.questions} questions`}
                        </Badge>
                      </div>
                      <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug">
                        <Link
                          href={`/student/quizzes/${quiz.id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {quiz.title}
                        </Link>
                      </h3>
                      <div className="mt-auto pt-[var(--grid-pad)]">
                        <Link href={`/student/quizzes/${quiz.id}`}>
                          <Button size="sm">
                            {attempt ? "Retake / review" : "Take quiz"}
                          </Button>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
            </>
          )}
        </div>
    </div>
  );
}
