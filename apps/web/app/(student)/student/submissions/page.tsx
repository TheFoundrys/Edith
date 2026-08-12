import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentSubmissionsPage() {
  const session = await requireStudent();

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { userId: session.user.id, status: "SUBMITTED" },
    include: {
      assignment: {
        include: { program: { select: { name: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Submissions"
        description="Assignments you’ve submitted."
      />

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Submit an assignment from a course to see it here."
          action={
            <Link href="/student/assignments" className="text-sm underline">
              View assignments
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <Panel key={submission.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/student/assignments/${submission.assignmentId}`}
                    className="font-medium hover:underline"
                  >
                    {submission.assignment?.title ?? "Assignment"}
                  </Link>
                  <p className="mt-1 text-sm text-fg-muted">
                    {submission.assignment?.program.name ?? "Program"}
                    {submission.submittedAt
                      ? ` · ${submission.submittedAt.toLocaleString()}`
                      : ""}
                  </p>
                </div>
                <Badge tone="success">Submitted</Badge>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
