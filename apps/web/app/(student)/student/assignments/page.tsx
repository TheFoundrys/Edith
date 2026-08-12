import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentAssignmentsPage() {
  const session = await requireStudent();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { programId: true },
  });
  const programIds = enrollments.map((e) => e.programId);

  const assignments = programIds.length
    ? await prisma.assignment.findMany({
        where: { programId: { in: programIds }, isPublished: true },
        include: {
          program: { select: { name: true } },
          submissions: {
            where: { userId: session.user.id },
            take: 1,
          },
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      })
    : [];

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Work from your enrolled courses."
      />

      {assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Assignments from your enrolled courses will appear here."
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const submission = assignment.submissions[0];
            return (
              <Panel key={assignment.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="font-medium hover:underline"
                    >
                      {assignment.title}
                    </Link>
                    <p className="mt-1 text-sm text-fg-muted">
                      {assignment.program.name}
                      {assignment.dueAt
                        ? ` · Due ${assignment.dueAt.toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <Badge
                    tone={
                      submission?.status === "SUBMITTED" ? "success" : "neutral"
                    }
                  >
                    {submission?.status === "SUBMITTED" ? "Submitted" : "Open"}
                  </Badge>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
