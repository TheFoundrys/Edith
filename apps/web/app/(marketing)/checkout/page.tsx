import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/student/course-checkout-panel";
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

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: slug } = await searchParams;
  if (!slug) redirect("/courses");

  const session = await requireStudent();
  const course = await prisma.program.findFirst({
    where: { slug, status: "PUBLISHED" },
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

  return (
    <MarketingShell maxWidth="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Payment
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.name}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {free
          ? "This course is free — confirm enrollment to unlock learning."
          : "Complete payment to unlock the learning platform."}
      </p>

      <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-fg-muted">Amount due</span>
          <span className="text-lg font-semibold">
            {free ? "Free" : formatCurrency(price, course.tuitionCurrency)}
          </span>
        </div>
        {free ? (
          <FreeEnrollButton courseSlug={course.slug} />
        ) : (
          <CourseCheckoutPanel
            courseSlug={course.slug}
            amount={price}
            currency={course.tuitionCurrency}
          />
        )}
      </div>

      {!free ? (
        <p className="mt-4 text-xs text-fg-muted">
          By paying you agree to the{" "}
          <Link href="/legal/terms" className="underline">
            terms
          </Link>
          .
        </p>
      ) : (
        <Link href={`/courses/${course.slug}`} className="mt-4 inline-block">
          <Button variant="ghost" size="sm">
            Back to course
          </Button>
        </Link>
      )}
    </MarketingShell>
  );
}
