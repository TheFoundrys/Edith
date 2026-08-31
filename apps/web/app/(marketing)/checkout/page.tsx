import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/student/course-checkout-panel";
import { FreeEnrollButton } from "@/components/student/free-enroll-button";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildCourseQuote } from "@/lib/payments/quote";
import { coursePrice } from "@/lib/programs/pricing";
import { formatCurrency } from "@/lib/utils";
import { afterEnrollmentHref, catalogHrefForProgram, isPersonalityProfileProgram } from "@/lib/assessments/personality-profile";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>;
}) {
  const { course: slug, intake: intakeId } = await searchParams;
  if (!slug) redirect("/courses");

  const session = await requireStudent();
  const course = await prisma.program.findFirst({
    where: {
      organizationId: session.user.organizationId,
      slug,
      status: "PUBLISHED",
    },
  });
  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: session.user.id, programId: course.id },
    },
  });
  if (enrollment?.status === "ACTIVE") {
    redirect(afterEnrollmentHref(course));
  }

  const quote = await buildCourseQuote({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    program: course,
  });
  if ("error" in quote) notFound();
  const price = quote.totalAmount;
  const free = coursePrice(course) === 0;

  return (
    <MarketingShell maxWidth="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Payment
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {free
          ? "This course is free — confirm enrollment to unlock learning."
          : isPersonalityProfileProgram(course)
            ? "Complete payment to unlock aptitude, quantitative and psyche analysis."
            : "Complete payment to unlock the learning platform."}
      </p>

      <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-fg-muted">Amount due</span>
          <span className="text-lg font-semibold">
            {free ? "Free" : formatCurrency(price, quote.currency)}
          </span>
        </div>
        {!free ? (
          <dl className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-muted">Course fee</dt>
              <dd>{formatCurrency(quote.principalAmount, quote.currency)}</dd>
            </div>
            {quote.gstAmount > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">GST</dt>
                <dd>{formatCurrency(quote.gstAmount, quote.currency)}</dd>
              </div>
            ) : null}
            {quote.convenienceFee > 0 ? (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-muted">Convenience fee</dt>
                <dd>
                  {formatCurrency(quote.convenienceFee, quote.currency)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {free ? (
          <FreeEnrollButton courseSlug={course.slug} intakeId={intakeId} />
        ) : (
          <CourseCheckoutPanel
            courseSlug={course.slug}
            intakeId={intakeId}
            amount={price}
            currency={quote.currency}
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
        <Link href={catalogHrefForProgram(course)} className="mt-4 inline-block">
          <Button variant="ghost" size="sm">
            Back to course
          </Button>
        </Link>
      )}
    </MarketingShell>
  );
}
