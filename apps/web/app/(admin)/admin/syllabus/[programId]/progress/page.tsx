import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { flattenPublishedActivities } from "@/lib/learning/outline";

export default async function AdminSyllabusProgressPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const session = await requireCapability("manageContent");

  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      organizationId: session.user.organizationId,
    },
    include: {
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
  });
  if (!program) notFound();

  const activities = program.syllabus
    ? flattenPublishedActivities(program.syllabus.modules)
    : [];
  const activityIds = activities.map((a) => a.id);

  const enrollments = await prisma.enrollment.findMany({
    where: {
      programId,
      status: "ACTIVE",
      organizationId: session.user.organizationId,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const progressRows =
    activityIds.length > 0 && enrollments.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            lessonId: { in: activityIds },
            completedAt: { not: null },
            userId: { in: enrollments.map((e) => e.userId) },
          },
        })
      : [];

  const completedByUser = new Map<string, Set<string>>();
  for (const row of progressRows) {
    const set = completedByUser.get(row.userId) ?? new Set<string>();
    set.add(row.lessonId);
    completedByUser.set(row.userId, set);
  }

  return (
    <div>
      <PageHeader
        title="Course progress"
        description={program.title}
        actions={
          <Link href={`/admin/syllabus/${programId}`}>
            <Button variant="secondary">Edit syllabus</Button>
          </Link>
        }
      />

      {!program.syllabus ? (
        <EmptyState
          title="No syllabus"
          description="Create a syllabus before tracking learner progress."
          action={
            <Link href={`/admin/syllabus/${programId}`}>
              <Button size="sm">Open syllabus</Button>
            </Link>
          }
        />
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="No enrolled learners"
          description="Progress appears here after students have an ACTIVE enrollment."
        />
      ) : (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-fg-muted">
                <th className="px-5 py-3 font-medium">Learner</th>
                <th className="px-5 py-3 font-medium">Completed</th>
                <th className="px-5 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => {
                const done = completedByUser.get(enrollment.userId)?.size ?? 0;
                const total = activityIds.length;
                const pct = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <tr
                    key={enrollment.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">{enrollment.user.name}</p>
                      <p className="text-xs text-fg-muted">
                        {enrollment.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-fg-muted">
                      {done} / {total}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-bg">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <Badge tone={pct === 100 ? "success" : "neutral"}>
                          {pct}%
                        </Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
