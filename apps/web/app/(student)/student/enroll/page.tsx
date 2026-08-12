import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { programCategoryLabel } from "@/lib/programs/categories";
import { formatCurrency } from "@/lib/utils";

function coursePrice(program: {
  tuitionAmount: number | null;
  applicationFee: number | null;
}) {
  if (program.tuitionAmount != null && program.tuitionAmount > 0) {
    return program.tuitionAmount;
  }
  if (program.applicationFee != null && program.applicationFee > 0) {
    return program.applicationFee;
  }
  return 0;
}

export default async function StudentEnrollPage() {
  const session = await requireStudent();

  const [courses, enrollments] = await Promise.all([
    prisma.program.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { name: "asc" },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { programId: true },
    }),
  ]);

  const enrolled = new Set(enrollments.map((e) => e.programId));
  const available = courses.filter((c) => !enrolled.has(c.id));

  return (
    <div className="peak-rise">
      <PageHeader
        title="Enroll"
        description="Choose a course to join — free courses unlock immediately; paid ones continue to Payment."
      />

      {available.length === 0 ? (
        <EmptyState
          title={courses.length === 0 ? "No courses yet" : "You're all set"}
          description={
            courses.length === 0
              ? "Published courses will appear here when the catalog is ready."
              : "You're enrolled in every published course. Open My Courses to learn."
          }
          action={
            <Link href="/student/my-courses">
              <Button size="sm">My courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {available.map((course) => {
            const price = coursePrice(course);
            const free = price === 0;
            return (
              <article key={course.id} className="peak-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    {programCategoryLabel(course.category)}
                  </p>
                  <Badge tone={free ? "success" : "neutral"}>
                    {free
                      ? "Free"
                      : formatCurrency(price, course.tuitionCurrency)}
                  </Badge>
                </div>

                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  {course.name}
                </h2>
                {course.summary ? (
                  <p className="mt-2 text-sm text-fg-muted line-clamp-3 leading-relaxed">
                    {course.summary}
                  </p>
                ) : null}

                <div className="mt-auto pt-[var(--grid-pad)] flex flex-wrap gap-2">
                  <Link href={`/enroll/${course.slug}`}>
                    <Button size="sm">Enroll</Button>
                  </Link>
                  <Link href={`/courses/${course.slug}`}>
                    <Button size="sm" variant="secondary">
                      Details
                    </Button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
