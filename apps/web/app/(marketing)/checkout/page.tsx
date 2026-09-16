import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CourseCheckoutPanel } from "@/components/student/course-checkout-panel";
import { FreeEnrollButton } from "@/components/student/free-enroll-button";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/page";
import { resolvePublishedProgramBySlug } from "@/lib/compass/program-bridge";
import { requireStudent } from "@/lib/auth/session";
import { findStudentEnrollment } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  canCheckoutAdmissionsProgram,
  requiresApplication,
} from "@/lib/enrollment/admissions";
import { crmApplyHref } from "@/lib/crm/urls";
import { buildCourseQuote } from "@/lib/payments/quote";
import { coursePrice } from "@/lib/programs/pricing";
import { hasPaidPersonalityExamAccess } from "@/lib/assessments/personality-access";
import {
  afterEnrollmentHref,
  catalogHrefForProgram,
  isPersonalityProfileProgram,
} from "@/lib/assessments/personality-profile";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; intake?: string }>;
}) {
  const { course: slug, intake: intakeId } = await searchParams;
  if (!slug) redirect("/courses");

  const session = await requireStudent();
  const course = isCompassDatabase()
    ? await resolvePublishedProgramBySlug(slug, session.user.organizationId)
    : await prisma.program.findFirst({
        where: {
          organizationId: session.user.organizationId,
          slug,
          status: "PUBLISHED",
        },
        select: {
          id: true,
          slug: true,
          title: true,
          formDefinitionId: true,
          price: true,
          tuitionCurrency: true,
          applicationFee: true,
          category: true,
          type: true,
          sku: true,
          domainSlug: true,
        },
      });
  if (!course || course.status !== "PUBLISHED") notFound();

  const enrollment = await findStudentEnrollment(session.user.id, course.id);
  if (enrollment?.status === "ACTIVE") {
    const examPaid =
      !isPersonalityProfileProgram(course) ||
      (await hasPaidPersonalityExamAccess({
        userId: session.user.id,
        programId: course.id,
      }));
    if (examPaid) {
      redirect(afterEnrollmentHref(course));
    }
  }

  const admissionsProgram = requiresApplication(course);
  const checkoutAllowed = canCheckoutAdmissionsProgram(course, enrollment);

  if (admissionsProgram && !checkoutAllowed) {
    const applyHref = crmApplyHref({ programSlug: course.slug });
    const awaitingAdmission = enrollment?.status === "PENDING";

    return (
      <MarketingShell maxWidth="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          Payment
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.title}</h1>
        <Panel className="mt-8 p-5 space-y-4">
          <Badge tone="warning">Admission required</Badge>
          <p className="text-sm text-fg-muted leading-relaxed">
            {awaitingAdmission
              ? "Your application is on file. Tuition checkout unlocks after CRM admits you to this programme."
              : "This degree programme requires a CRM application and admission before tuition payment."}
          </p>
          {!awaitingAdmission ? (
            <Link href={applyHref}>
              <Button size="sm">Apply in CRM</Button>
            </Link>
          ) : (
            <Link href={`/courses/${course.slug}`}>
              <Button size="sm" variant="secondary">
                Back to programme
              </Button>
            </Link>
          )}
        </Panel>
      </MarketingShell>
    );
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
        {free ? (
          <FreeEnrollButton courseSlug={course.slug} intakeId={intakeId} />
        ) : (
          <CourseCheckoutPanel
            courseSlug={course.slug}
            intakeId={intakeId}
            amount={price}
            currency={quote.currency}
            initialQuote={quote}
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
