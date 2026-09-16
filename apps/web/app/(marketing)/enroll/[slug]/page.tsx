import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FreeEnrollButton } from "@/components/student/free-enroll-button";
import { StartApplicationButton } from "@/components/student/start-application-button";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import {
  publishedProgramCampusName,
  publishedProgramDepartmentName,
  publishedProgramIntakes,
  resolvePublishedProgramBySlug,
} from "@/lib/compass/program-bridge";
import { requireStudent } from "@/lib/auth/session";
import { findStudentEnrollment } from "@/lib/enrollment/queries";
import { coursePrice } from "@/lib/programs/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  afterEnrollmentHref,
  catalogHrefForProgram,
  isPersonalityProfileProgram,
} from "@/lib/assessments/personality-profile";
import { hasPaidPersonalityExamAccess } from "@/lib/assessments/personality-access";
import { buildCourseQuote } from "@/lib/payments/quote";

export default async function EnrollPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ intake?: string }>;
}) {
  const { slug } = await params;
  const { intake: requestedIntakeId } = await searchParams;
  const session = await requireStudent();

  const program = await resolvePublishedProgramBySlug(
    slug,
    session.user.organizationId,
  );
  if (!program) notFound();

  const departmentName = publishedProgramDepartmentName(program);
  const campusName = publishedProgramCampusName(program);
  const intakes = publishedProgramIntakes(program);

  const enrollment = await findStudentEnrollment(session.user.id, program.id);
  const assessment = isPersonalityProfileProgram(program);
  if (enrollment?.status === "ACTIVE") {
    const examPaid =
      !assessment ||
      (await hasPaidPersonalityExamAccess({
        userId: session.user.id,
        programId: program.id,
      }));
    if (examPaid) {
      redirect(afterEnrollmentHref(program));
    }
  }

  const price = coursePrice(program);
  const free = price === 0;
  const quote =
    !free && !program.formDefinitionId
      ? await buildCourseQuote({
          organizationId: session.user.organizationId,
          userId: session.user.id,
          program,
        })
      : null;
  const quoteOk = quote && !("error" in quote) ? quote : null;
  const awaitingCrm =
    enrollment?.status === "PENDING" && program.requiresCrmCallback;
  const awaitingPayment =
    !free &&
    !program.requiresCrmCallback &&
    (enrollment?.status === "PENDING" ||
      (assessment && enrollment?.status === "ACTIVE"));
  const selectedIntake =
    intakes.find((intake) => intake.id === requestedIntakeId) ??
    intakes[0] ??
    null;

  return (
    <MarketingShell maxWidth="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {assessment ? "Assessment" : "Enrollment"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{program.title}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {departmentName ? `${departmentName} · ` : ""}
        {assessment ? "Online · Self-paced" : (campusName ?? "Online / Hybrid")}
      </p>
      {program.description ? (
        <p className="mt-4 text-sm text-fg leading-relaxed">{program.description}</p>
      ) : null}

      {intakes.length > 0 && !program.formDefinitionId ? (
        <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="intake">Choose intake</Label>
            <Select
              id="intake"
              name="intake"
              defaultValue={selectedIntake?.id}
            >
              {intakes.map((intake) => (
                <option key={intake.id} value={intake.id}>
                  {intake.name}
                  {intake.startDate
                    ? ` — starts ${intake.startDate.toLocaleDateString("en-IN")}`
                    : ""}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Select intake
          </Button>
        </form>
      ) : null}

      {awaitingCrm ? (
        <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-3">
          <p className="text-sm font-medium">Awaiting CRM confirmation</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            Your enrollment request was sent to CRM. Learning unlocks after they
            confirm.
          </p>
          <Link href={`/student/my-courses/${program.id}`}>
            <Button variant="secondary">View status</Button>
          </Link>
        </div>
      ) : awaitingPayment ? (
        <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-3">
          <p className="text-sm font-medium">Payment pending</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            You started enrolling in this course. Complete payment to unlock
            {assessment ? " the exam." : " learning."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/checkout?course=${encodeURIComponent(program.slug)}${
                selectedIntake
                  ? `&intake=${encodeURIComponent(selectedIntake.id)}`
                  : ""
              }`}
            >
              <Button>Continue to payment</Button>
            </Link>
            <Link href={catalogHrefForProgram(program)}>
              <Button variant="ghost">Back to course</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-border bg-bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {program.formDefinitionId
              ? "Admissions"
              : assessment
                ? "Assessment fee"
                : "Course fee"}
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {program.formDefinitionId
              ? "Application required"
              : free
                ? "Free"
                : formatCurrency(
                    quoteOk?.totalAmount ?? price,
                    quoteOk?.currency ?? program.tuitionCurrency,
                  )}
          </p>
          {quoteOk?.offerId ? (
            <p className="mt-2 text-sm text-fg-muted">
              A personalised offer is applied for your account.
            </p>
          ) : null}
          {quoteOk && quoteOk.gstAmount > 0 ? (
            <p className="mt-2 text-sm text-fg-muted">
              {formatCurrency(quoteOk.principalAmount, quoteOk.currency)} + GST{" "}
              {formatCurrency(quoteOk.gstAmount, quoteOk.currency)}
            </p>
          ) : null}
          {program.formDefinitionId ? (
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              Admissions for this programme are handled in CRM. Apply there to
              submit documents and track the offer.
            </p>
          ) : null}
          {program.requiresCrmCallback ? (
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              This course requires CRM confirmation after you enroll
              {free ? "" : " and pay"}.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {program.formDefinitionId ? (
              <StartApplicationButton
                programSlug={program.slug}
                fullWidth
              />
            ) : free ? (
              <FreeEnrollButton
                courseSlug={program.slug}
                intakeId={selectedIntake?.id}
              />
            ) : (
              <Link
                href={`/checkout?course=${encodeURIComponent(program.slug)}${
                  selectedIntake
                    ? `&intake=${encodeURIComponent(selectedIntake.id)}`
                    : ""
                }`}
              >
                <Button>Continue to payment</Button>
              </Link>
            )}
            <Link href={catalogHrefForProgram(program)}>
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </div>
      )}
    </MarketingShell>
  );
}
