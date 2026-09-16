import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { listCompassAdminPrograms } from "@/lib/compass/admin-programs";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { programCategoryLabel } from "@/lib/programs/categories";

function syllabusTone(status: string | null) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  if (status === "DRAFT") return "warning" as const;
  return "neutral" as const;
}

function syllabusLabel(status: string | null) {
  if (!status) return "None";
  return status;
}

export default async function AdminSyllabusListPage() {
  const session = await requireCapability("manageContent");
  const compass = isCompassDatabase();
  const programs = compass
    ? (await listCompassAdminPrograms(session.user.organizationId)).map(
        (course) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          category: course.category,
          syllabus: course.moduleCount
            ? {
                status: course.syllabusStatus,
                _count: { modules: course.moduleCount },
              }
            : null,
        }),
      )
    : await prisma.program.findMany({
        where: { organizationId: session.user.organizationId },
        include: {
          syllabus: {
            include: {
              _count: { select: { modules: true } },
            },
          },
        },
        orderBy: { title: "asc" },
      });

  const withSyllabus = programs.filter((p) => p.syllabus).length;
  const published = programs.filter(
    (p) => p.syllabus?.status === "PUBLISHED",
  ).length;

  return (
    <div>
      <PageHeader
        title="Syllabus"
        description="YGP and PGP: section name, title, and content. Degrees keep the full outline with activities, enrollments, and progress."
      />

      {programs.length > 0 ? (
        <div className="peak-stats">
          <div className="peak-stat">
            <p className="peak-stat-label">Programs</p>
            <p className="peak-stat-value">{programs.length}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">With syllabus</p>
            <p className="peak-stat-value">{withSyllabus}</p>
          </div>
          <div className="peak-stat">
            <p className="peak-stat-label">Published</p>
            <p className="peak-stat-value">{published}</p>
          </div>
        </div>
      ) : null}

      {programs.length === 0 ? (
        <EmptyState
          title="No programs"
          description="Create a program before adding a course syllabus."
          action={
            <Link href="/admin/programs/new">
              <Button size="sm">New program</Button>
            </Link>
          }
        />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Track</th>
                <th className="px-4 py-3 font-medium text-right">Sections</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
                <th className="px-4 py-3 font-medium text-right">Syllabus</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => {
                const sections = program.syllabus?._count.modules ?? 0;
                const status = program.syllabus?.status ?? null;
                return (
                  <tr
                    key={program.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/syllabus/${program.id}`}
                        className="font-medium hover:underline underline-offset-2"
                      >
                        {program.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-fg-muted">
                        /{program.slug}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                      {programCategoryLabel(program.category)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {sections}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={syllabusTone(status)}>
                        {syllabusLabel(status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link href={`/admin/syllabus/${program.id}`}>
                          <Button size="sm">
                            {program.syllabus ? "Edit" : "Create"}
                          </Button>
                        </Link>
                        {program.syllabus ? (
                          <Link href={`/admin/syllabus/${program.id}/progress`}>
                            <Button size="sm" variant="secondary">
                              Progress
                            </Button>
                          </Link>
                        ) : null}
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
