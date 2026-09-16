import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startRandomCourseMcqAction } from "@/lib/actions/course-mcq";
import { requireStudent } from "@/lib/auth/session";
import { requireStudentEnrollmentAccess } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function CourseMcqIndexPage({
  params,
}: {
  params: Promise<{ "course-id": string }>;
}) {
  const { "course-id": courseId } = await params;
  const session = await requireStudent();

  const enrollment = await requireStudentEnrollmentAccess(
    session.user.id,
    courseId,
    ["ACTIVE", "COMPLETED"],
  );
  if (!enrollment) notFound();
  if (isCompassDatabase()) notFound();

  const program = await prisma.program.findFirst({
    where: { id: courseId },
    select: { title: true },
  });
  if (!program) notFound();

  const banks = await prisma.courseMcq.findMany({
    where: {
      programId: courseId,
      organizationId: session.user.organizationId,
      isActive: true,
      status: "READY",
    },
    orderBy: [{ setNumber: "asc" }, { updatedAt: "desc" }],
  });

  if (banks.length === 0) notFound();
  if (banks.length === 1) {
    redirect(`/student/my-courses/${courseId}/mcq/${banks[0]!.id}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course assessment"
        description={`${program.title} · ${banks.length} question sets · one is chosen at random each attempt`}
        actions={
          <Link
            href={`/student/my-courses/${courseId}`}
            className="text-sm text-fg-muted underline"
          >
            Back to course
          </Link>
        }
      />

      <Panel className="space-y-4 p-5">
        <p className="text-sm text-fg-muted leading-relaxed">
          Each sitting picks one of {banks.length} published sets at random. Within
          that set, question order and answer options are shuffled. Retakes may draw
          a different set.
        </p>
        <form action={startRandomCourseMcqAction}>
          <input type="hidden" name="programId" value={courseId} />
          <Button type="submit">Start randomized assessment</Button>
        </form>
      </Panel>

      <details className="text-sm text-fg-muted">
        <summary className="cursor-pointer underline underline-offset-2">
          View all sets ({banks.length})
        </summary>
        <ul className="mt-3 space-y-2">
          {banks.map((mcq) => (
            <li key={mcq.id}>
              <Link
                href={`/student/my-courses/${courseId}/mcq/${mcq.id}`}
                className="underline underline-offset-2"
              >
                {mcq.title ?? `Set ${mcq.setNumber || 1}`}
              </Link>
              <span className="ml-2">· {mcq.totalQuestions} questions per attempt</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
