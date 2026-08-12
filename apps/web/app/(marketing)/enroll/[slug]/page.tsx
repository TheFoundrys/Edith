import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FreeEnrollButton } from "@/components/student/free-enroll-button";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
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

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await requireStudent();

  const course = await prisma.program.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { campus: true, department: true },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: session.user.id, programId: course.id },
    },
  });
  if (enrollment?.status === "ACTIVE") {
    redirect(`/student/my-courses/${course.id}`);
  }

  const price = coursePrice(course);
  const free = price === 0;
  const awaitingCrm =
    enrollment?.status === "PENDING" && course.requiresCrmCallback;

  return (
    <MarketingShell maxWidth="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Enrollment
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.name}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {course.department?.name ? `${course.department.name} · ` : ""}
        {course.campus?.name ?? "Online / Hybrid"}
      </p>
      {course.summary ? (
        <p className="mt-4 text-sm text-fg leading-relaxed">{course.summary}</p>
      ) : null}

      {awaitingCrm ? (
        <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-3">
          <p className="text-sm font-medium">Awaiting CRM confirmation</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            Your enrollment request was sent to CRM. Learning unlocks after they
            confirm.
          </p>
          <Link href={`/student/my-courses/${course.id}`}>
            <Button variant="secondary">View status</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 border border-border bg-bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            Course fee
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {free ? "Free" : formatCurrency(price, course.tuitionCurrency)}
          </p>
          {course.requiresCrmCallback ? (
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              This course requires CRM confirmation after you enroll
              {free ? "" : " and pay"}.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {free ? (
              <FreeEnrollButton courseSlug={course.slug} />
            ) : (
              <Link href={`/checkout?course=${encodeURIComponent(course.slug)}`}>
                <Button>Continue to payment</Button>
              </Link>
            )}
            <Link href={`/courses/${course.slug}`}>
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </div>
      )}
    </MarketingShell>
  );
}
