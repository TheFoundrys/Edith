import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignmentSubmitForm } from "@/components/student/assignment-submit-form";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ "assignment-id": string }>;
}) {
  const { "assignment-id": assignmentId } = await params;
  const session = await requireStudent();

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, isPublished: true },
    include: { program: { select: { id: true, name: true } } },
  });
  if (!assignment) notFound();

  const enrolled = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: assignment.programId,
      status: "ACTIVE",
    },
  });
  if (!enrolled) notFound();

  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      assignmentId,
      userId: session.user.id,
    },
  });

  return (
    <div>
      <PageHeader
        title={assignment.title}
        description={assignment.program.name}
        actions={
          <Link
            href="/student/assignments"
            className="text-sm text-fg-muted underline"
          >
            All assignments
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {assignment.dueAt ? (
          <Badge tone="neutral">
            Due {assignment.dueAt.toLocaleDateString()}
          </Badge>
        ) : null}
        <Badge
          tone={submission?.status === "SUBMITTED" ? "success" : "neutral"}
        >
          {submission?.status === "SUBMITTED" ? "Submitted" : "Not submitted"}
        </Badge>
      </div>

      {assignment.description ? (
        <Panel className="mb-6 p-5">
          <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
        </Panel>
      ) : null}

      <Panel className="p-5">
        <h2 className="text-sm font-medium mb-3">Your submission</h2>
        <AssignmentSubmitForm
          assignmentId={assignment.id}
          initialContent={submission?.contentBody}
          alreadySubmitted={submission?.status === "SUBMITTED"}
          submittedAt={submission?.submittedAt}
        />
      </Panel>
    </div>
  );
}
