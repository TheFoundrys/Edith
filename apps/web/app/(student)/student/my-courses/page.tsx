import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { LmsCourseCard } from "@/components/student/lms-course-card";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";
import {
  PERSONALITY_PROFILE_HREF,
  isPersonalityProfileProgram,
  personalityProgress,
  type PersonalityResponses,
} from "@/lib/assessments/personality-profile";

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
      status: { in: ["ACTIVE", "PENDING"] },
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
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }, { createdAt: "desc" }],
  });

  const personalityAttempt = enrollments.some((e) =>
    isPersonalityProfileProgram(e.program),
  )
    ? await prisma.cliftonAssessment.findFirst({
        where: {
          userId: session.user.id,
          organizationId: session.user.organizationId,
        },
        orderBy: { createdAt: "desc" },
        select: { responses: true, status: true },
      })
    : null;
  const personalityResponses = (personalityAttempt?.responses ??
    {}) as PersonalityResponses;

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
    <div className="lms-dashboard space-y-6">
      <PageHeader
        title="My courses"
        description="All programmes you are enrolled in, with progress and quick actions."
        actions={
          <Link href="/student/enroll">
            <Button variant="secondary" size="sm">
              Browse catalog
            </Button>
          </Link>
        }
      />

      {pending === "crm" ? (
        <Panel className="p-4">
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
            <Link href="/student/enroll">
              <Button size="sm">Browse courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const awaitingCrm =
              enrollment.status === "PENDING" &&
              enrollment.program.requiresCrmCallback;
            const awaitingPayment =
              enrollment.status === "PENDING" &&
              !enrollment.program.requiresCrmCallback &&
              !enrollment.payments.some((payment) => payment.status === "PAID");
            const published = enrollment.program.syllabus?.status === "PUBLISHED";
            const activities =
              enrollment.status === "ACTIVE" && !awaitingCrm && published
                ? flattenPublishedActivities(enrollment.program.syllabus!.modules)
                : [];
            const done = activities.filter((a) => completedSet.has(a.id)).length;
            const pct =
              activities.length === 0
                ? 0
                : Math.round((done / activities.length) * 100);
            const continueId = findContinueActivityId(activities, completedSet);

            if (
              enrollment.status === "ACTIVE" &&
              isPersonalityProfileProgram(enrollment.program)
            ) {
              const progress = personalityProgress(personalityResponses);
              return (
                <LmsCourseCard
                  key={enrollment.id}
                  title={enrollment.program.title}
                  href={PERSONALITY_PROFILE_HREF}
                  continueHref={
                    progress.pct === 100
                      ? `${PERSONALITY_PROFILE_HREF}/report`
                      : PERSONALITY_PROFILE_HREF
                  }
                  category={enrollment.program.category}
                  meta="Personality profile · 90-question exam"
                  done={progress.done}
                  total={progress.total}
                  pct={progress.pct}
                  actionLabel={progress.pct === 100 ? "View report" : "Open assessment"}
                />
              );
            }

            if (awaitingCrm || awaitingPayment || !published) {
              return (
                <Panel key={enrollment.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={
                          awaitingPayment
                            ? `/checkout?course=${encodeURIComponent(enrollment.program.slug)}`
                            : `/student/my-courses/${enrollment.programId}${awaitingCrm ? "?pending=crm" : ""}`
                        }
                        className="font-medium text-fg hover:text-brand"
                      >
                        {enrollment.program.title}
                      </Link>
                      <p className="mt-1 text-sm text-fg-muted">
                        {awaitingCrm
                          ? "Awaiting CRM confirmation"
                          : awaitingPayment
                            ? "Payment required to unlock learning"
                            : "Outline coming soon"}
                      </p>
                    </div>
                    <Badge
                      tone={
                        awaitingCrm ? "warning" : awaitingPayment ? "info" : "neutral"
                      }
                    >
                      {awaitingCrm
                        ? "Pending CRM"
                        : awaitingPayment
                          ? "Payment due"
                          : "Pending"}
                    </Badge>
                  </div>
                  {awaitingPayment ? (
                    <Link
                      href={`/checkout?course=${encodeURIComponent(enrollment.program.slug)}`}
                      className="mt-3 inline-block text-sm font-medium text-brand underline-offset-2 hover:underline"
                    >
                      Complete payment
                    </Link>
                  ) : null}
                </Panel>
              );
            }

            return (
              <LmsCourseCard
                key={enrollment.id}
                title={enrollment.program.title}
                href={`/student/my-courses/${enrollment.programId}`}
                continueHref={
                  continueId
                    ? `/student/learning/${enrollment.programId}/lessons/${continueId}`
                    : `/student/learning/${enrollment.programId}`
                }
                category={enrollment.program.category}
                meta={`${enrollment.program.campus?.name ?? "Hybrid"} · ${activities.length} activities`}
                done={done}
                total={activities.length}
                pct={pct}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
