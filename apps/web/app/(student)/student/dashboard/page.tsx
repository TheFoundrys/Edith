import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  findContinueActivityId,
  flattenPublishedActivities,
} from "@/lib/learning/outline";
import { displayProgramName } from "@/lib/programs/categories";

function formatWhen(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default async function StudentDashboardPage() {
  const session = await requireStudent();
  const userId = session.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          syllabus: {
            select: {
              status: true,
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                    select: { id: true, title: true, isPublished: true },
                  },
                },
              },
            },
          },
          intakes: {
            where: { isActive: true, startDate: { gte: new Date() } },
            orderBy: { startDate: "asc" },
            take: 2,
            select: { id: true, name: true, startDate: true },
          },
        },
      },
    },
    orderBy: [{ lastAccessedAt: "desc" }, { enrolledAt: "desc" }],
  });

  const programIds = enrollments.map((e) => e.program.id);
  const lessonIds = enrollments.flatMap((e) =>
    e.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(e.program.syllabus.modules).map((a) => a.id)
      : [],
  );

  const [completed, assignments, certificates, recentProgress] =
    await Promise.all([
      lessonIds.length
        ? prisma.lessonProgress.findMany({
            where: {
              userId,
              lessonId: { in: lessonIds },
              completedAt: { not: null },
            },
            select: { lessonId: true, completedAt: true },
          })
        : Promise.resolve([]),
      programIds.length
        ? prisma.assignment.findMany({
            where: {
              isPublished: true,
              programId: { in: programIds },
            },
            include: {
              program: { select: { title: true } },
              submissions: {
                where: { userId },
                select: { status: true },
                take: 1,
              },
            },
            orderBy: { dueAt: "asc" },
            take: 6,
          })
        : Promise.resolve([]),
      prisma.certificate.findMany({
        where: { userId },
        include: { program: { select: { title: true } } },
        orderBy: { issueDate: "desc" },
        take: 4,
      }),
      prisma.lessonProgress.findMany({
        where: { userId, completedAt: { not: null } },
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  syllabus: { select: { program: { select: { title: true } } } },
                },
              },
            },
          },
        },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
    ]);

  const completedSet = new Set(completed.map((p) => p.lessonId));

  const progressRows = enrollments
    .filter((e) => e.program.syllabus?.status === "PUBLISHED")
    .map((enrollment) => {
      const activities = flattenPublishedActivities(
        enrollment.program.syllabus!.modules,
      );
      const done = activities.filter((a) => completedSet.has(a.id)).length;
      const nextId = findContinueActivityId(activities, completedSet);
      return {
        id: enrollment.id,
        title: displayProgramName(
          enrollment.program.title,
          enrollment.program.category,
        ),
        href: nextId
          ? `/student/learn/${enrollment.program.id}/lessons/${nextId}`
          : `/student/learn/${enrollment.program.id}`,
        done,
        total: activities.length,
        pct:
          activities.length === 0
            ? 0
            : Math.round((done / activities.length) * 100),
      };
    });

  const continueRow = progressRows.find((row) => row.pct < 100) ?? progressRows[0];

  const upcoming = enrollments.flatMap((e) =>
    e.program.intakes.map((intake) => ({
      id: intake.id,
      name: intake.name,
      startDate: intake.startDate,
      program: displayProgramName(e.program.title, e.program.category),
    })),
  );

  const openAssignments = assignments.filter((assignment) => {
    const status = assignment.submissions[0]?.status;
    return status !== "SUBMITTED" && status !== "GRADED";
  });

  return (
    <div className="peak-rise space-y-8">
      <PageHeader
        title={`Welcome, ${session.user.name.split(" ")[0]}`}
        description="Pick up where you left off."
        actions={
          <Link href="/student/enroll">
            <Button variant="secondary" size="sm">
              Browse courses
            </Button>
          </Link>
        }
      />

      {continueRow ? (
        <section className="peak-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Continue learning
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            {continueRow.title}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {continueRow.done} of {continueRow.total} lessons complete
          </p>
          <div className="progress-track mt-4">
            <div
              className="progress-fill"
              style={{ width: `${continueRow.pct}%` }}
            />
          </div>
          <div className="mt-5">
            <Link href={continueRow.href}>
              <Button size="sm">Resume</Button>
            </Link>
          </div>
        </section>
      ) : (
        <section className="peak-card">
          <h2 className="text-xl font-semibold tracking-tight">
            Start a programme
          </h2>
          <p className="mt-2 text-sm text-fg-muted max-w-md">
            Enroll to unlock lessons, assignments, and certificates.
          </p>
          <div className="mt-5">
            <Link href="/student/enroll">
              <Button size="sm">Browse courses</Button>
            </Link>
          </div>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="peak-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Course progress</h2>
            <Link href="/student/progress" className="link-quiet text-xs">
              All progress
            </Link>
          </div>
          {progressRows.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">No active courses yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {progressRows.slice(0, 4).map((row) => (
                <li key={row.id}>
                  <Link href={row.href} className="block">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium truncate">{row.title}</p>
                      <p className="text-xs text-fg-muted tabular-nums">
                        {row.pct}%
                      </p>
                    </div>
                    <div className="progress-track mt-2">
                      <div
                        className="progress-fill"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="peak-card">
          <h2 className="text-base font-semibold">Upcoming classes</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">
              No upcoming intakes on your courses.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.slice(0, 4).map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="font-medium">{item.program}</p>
                  <p className="text-fg-muted">
                    {item.name}
                    {item.startDate ? ` · ${formatWhen(item.startDate)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="peak-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Assignments</h2>
            <Link href="/student/assessments" className="link-quiet text-xs">
              All work
            </Link>
          </div>
          {openAssignments.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">You are up to date.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {openAssignments.slice(0, 4).map((assignment) => (
                <li key={assignment.id} className="text-sm">
                  <p className="font-medium">{assignment.title}</p>
                  <p className="text-fg-muted">
                    {assignment.program.title}
                    {assignment.dueAt
                      ? ` · Due ${formatWhen(assignment.dueAt)}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="peak-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">Certificates</h2>
            <Link href="/student/certificates" className="link-quiet text-xs">
              View all
            </Link>
          </div>
          {certificates.length === 0 ? (
            <p className="mt-3 text-sm text-fg-muted">
              Finish a course to earn a certificate.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {certificates.map((certificate) => (
                <li key={certificate.id}>
                  <Link
                    href={`/student/certificates/${certificate.id}`}
                    className="text-sm font-medium link-quiet"
                  >
                    {certificate.title}
                  </Link>
                  <p className="text-xs text-fg-muted">
                    {certificate.program.title}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="peak-card">
        <h2 className="text-base font-semibold">Recent activity</h2>
        {recentProgress.length === 0 ? (
          <p className="mt-3 text-sm text-fg-muted">
            Completed lessons will show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recentProgress.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="font-medium">{item.lesson.title}</p>
                <p className="text-fg-muted">
                  {item.lesson.module.syllabus.program.title}
                  {item.completedAt
                    ? ` · ${formatWhen(item.completedAt)}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
