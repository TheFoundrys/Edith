import { notFound } from "next/navigation";
import { AssignmentEditor } from "@/components/admin/assignment-editor";
import { AssignmentIntegrityCard } from "@/components/admin/assignment-integrity-card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { rescanAssignmentIntegrityAction } from "@/lib/actions/assignments-admin";
import { gradeAssignmentSubmissionAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { listStaffProgramOptions } from "@/lib/compass/program-bridge";
import { prisma } from "@/lib/db";
import { parseIntegrityReport } from "@/lib/learning/assignment-integrity";

export default async function AdminEditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageContent");
  const assignment = await prisma.assignment.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      submissions: {
        where: { status: { in: ["SUBMITTED", "GRADED"] } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assignment) notFound();

  const programOptions = await listStaffProgramOptions(
    session.user.organizationId,
  );
  const programs = programOptions.map((program) => ({
    id: program.id,
    title: program.title,
  }));

  return (
    <div className="space-y-8">
      <AssignmentEditor
        programs={programs}
        assignment={{
          id: assignment.id,
          programId: assignment.programId,
          title: assignment.title,
          description: assignment.description,
          dueAt: assignment.dueAt?.toISOString() ?? null,
          isPublished: assignment.isPublished,
        }}
      />

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Student submissions</h2>
          {assignment.submissions.length > 0 ? (
            <form action={rescanAssignmentIntegrityAction.bind(null, assignment.id)}>
              <Button type="submit" size="sm" variant="secondary">
                Rescan plagiarism
              </Button>
            </form>
          ) : null}
        </div>
        {assignment.submissions.length === 0 ? (
          <Panel className="p-5 text-sm text-fg-muted">
            No submitted work to grade.
          </Panel>
        ) : (
          <div className="space-y-4">
            {assignment.submissions.map((submission) => {
              const integrity = parseIntegrityReport(submission.integrityReport);
              return (
              <Panel key={submission.id} className="p-5">
                <div className="mb-4">
                  <p className="font-medium">{submission.user.name}</p>
                  <p className="text-sm text-fg-muted">
                    {submission.user.email}
                    {submission.submittedAt
                      ? ` · ${submission.submittedAt.toLocaleString()}`
                      : ""}
                    {integrity && integrity.risk !== "none"
                      ? ` · ${Math.round(integrity.score * 100)}% similar to a peer`
                      : ""}
                  </p>
                </div>
                <p className="mb-4 whitespace-pre-wrap text-sm">
                  {submission.contentBody || "No written response."}
                </p>
                <AssignmentIntegrityCard report={submission.integrityReport} />
                <form
                  action={gradeAssignmentSubmissionAction.bind(
                    null,
                    submission.id,
                  )}
                  className="mt-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto]"
                >
                  <div>
                    <Label htmlFor={`grade-${submission.id}`}>Grade</Label>
                    <Input
                      id={`grade-${submission.id}`}
                      name="grade"
                      type="number"
                      step="0.01"
                      defaultValue={submission.grade ?? ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`feedback-${submission.id}`}>Feedback</Label>
                    <Textarea
                      id={`feedback-${submission.id}`}
                      name="feedback"
                      defaultValue={submission.feedback ?? ""}
                    />
                  </div>
                  <Button type="submit" className="self-end">
                    Save grade
                  </Button>
                </form>
              </Panel>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
