import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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

export default async function StudentPaymentPage() {
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
  const payable = courses.filter((c) => {
    if (enrolled.has(c.id)) return false;
    return coursePrice(c) > 0;
  });

  return (
    <div className="peak-rise">
      <PageHeader
        title="Payment"
        description="Complete fee payment to unlock learning. Free courses enroll from Enroll."
        actions={
          <Link href="/student/enroll">
            <Button variant="secondary" size="sm">
              Back to Enroll
            </Button>
          </Link>
        }
      />

      {payable.length === 0 ? (
        <EmptyState
          title="No payments due"
          description={
            enrolled.size > 0
              ? "Nothing waiting. Enroll in another course or open My Courses."
              : "Pick a paid course from Enroll, then complete payment here."
          }
          action={
            <Link href="/student/enroll">
              <Button size="sm">Browse enrollments</Button>
            </Link>
          }
        />
      ) : (
        <div className="cm-grid">
          {payable.map((course) => {
            const price = coursePrice(course);
            return (
              <article key={course.id} className="peak-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                    Fee due
                  </p>
                  <Badge tone="neutral">
                    {formatCurrency(price, course.tuitionCurrency)}
                  </Badge>
                </div>
                <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                  {course.name}
                </h2>
                <div className="mt-auto pt-[var(--grid-pad)] flex flex-wrap gap-2">
                  <Link href={`/checkout?course=${course.slug}`}>
                    <Button size="sm">Pay now</Button>
                  </Link>
                  <Link href={`/enroll/${course.slug}`}>
                    <Button size="sm" variant="secondary">
                      Review course
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
