import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FreeEnrollButton } from "@/components/student/free-enroll-button";
import { StartApplicationButton } from "@/components/student/start-application-button";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { coursePrice } from "@/lib/programs/pricing";
import { formatCurrency } from "@/lib/utils";
import {
  afterEnrollmentHref,
  catalogHrefForProgram,
  isPersonalityProfileProgram,
} from "@/lib/assessments/personality-profile";
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

  const course = await prisma.program.findFirst({
    where: {
      organizationId: session.user.organizationId,
      slug,
      status: "PUBLISHED",
    },
    include: {
      campus: true,
      department: true,
      intakes: {
        where: { isActive: true },
        orderBy: { startDate: "asc" },
      },
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

  const price = coursePrice(course);
  const free = price === 0;
  const assessment = isPersonalityProfileProgram(course);
  const quote =
    !free && !course.formDefinitionId
      ? await buildCourseQuote({
          organizationId: session.user.organizationId,
          userId: session.user.id,
          program: course,
        })
      : null;
  const quoteOk = quote && !("error" in quote) ? quote : null;
  const awaitingCrm =
    enrollment?.status === "PENDING" && course.requiresCrmCallback;
  const awaitingPayment =
    enrollment?.status === "PENDING" &&
    !course.requiresCrmCallback &&
    !free;
  const selectedIntake =
    course.intakes.find((intake) => intake.id === requestedIntakeId) ??
    course.intakes[0] ??
    null;

  return (
    <MarketingShell maxWidth="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {assessment ? "Assessment" : "Enrollment"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{course.title}</h1>
      <p className="mt-2 text-sm text-fg-muted">
        {course.department?.name ? `${course.department.name} · ` : ""}
        {assessment
          ? "Online · Self-paced"
          : (course.campus?.name ?? "Online / Hybrid")}
      </p>
      {course.description ? (
        <p className="mt-4 text-sm text-fg leading-relaxed">{course.description}</p>
      ) : null}

      {course.intakes.length > 0 && !course.formDefinitionId ? (
        <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="intake">Choose intake</Label>
            <Select
              id="intake"
              name="intake"
              defaultValue={selectedIntake?.id}
            >
              {course.intakes.map((intake) => (
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
          <Link href={`/student/my-courses/${course.id}`}>
            <Button variant="secondary">View status</Button>
          </Link>
        </div>
      ) : awaitingPayment ? (
        <div className="mt-8 border border-border bg-bg-elevated p-5 space-y-3">
          <p className="text-sm font-medium">Payment pending</p>
          <p className="text-sm text-fg-muted leading-relaxed">
            You started enrolling in this course. Complete payment to unlock
            learning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/checkout?course=${encodeURIComponent(course.slug)}${
                selectedIntake
                  ? `&intake=${encodeURIComponent(selectedIntake.id)}`
                  : ""
              }`}
            >
              <Button>Continue to payment</Button>
            </Link>
            <Link href={catalogHrefForProgram(course)}>
              <Button variant="ghost">Back to course</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 border border-border bg-bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {course.formDefinitionId
              ? "Admissions"
              : assessment
                ? "Assessment fee"
                : "Course fee"}
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {course.formDefinitionId
              ? "Application required"
              : free
                ? "Free"
                : formatCurrency(
                    quoteOk?.totalAmount ?? price,
                    quoteOk?.currency ?? course.tuitionCurrency,
                  )}
          </p>
          {quoteOk && quoteOk.gstAmount > 0 ? (
            <p className="mt-2 text-sm text-fg-muted">
              {formatCurrency(quoteOk.principalAmount, quoteOk.currency)} + GST{" "}
              {formatCurrency(quoteOk.gstAmount, quoteOk.currency)}
            </p>
          ) : null}
          {course.formDefinitionId ? (
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              Complete the admissions form and receive approval before course
              enrollment or payment.
            </p>
          ) : null}
          {course.requiresCrmCallback ? (
            <p className="mt-3 text-sm text-fg-muted leading-relaxed">
              This course requires CRM confirmation after you enroll
              {free ? "" : " and pay"}.
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {course.formDefinitionId ? (
              <StartApplicationButton
                programId={course.id}
                intakes={course.intakes.map((intake) => ({
                  id: intake.id,
                  name: intake.name,
                }))}
                fullWidth
              />
            ) : free ? (
              <FreeEnrollButton
                courseSlug={course.slug}
                intakeId={selectedIntake?.id}
              />
            ) : (
              <Link
                href={`/checkout?course=${encodeURIComponent(course.slug)}${
                  selectedIntake
                    ? `&intake=${encodeURIComponent(selectedIntake.id)}`
                    : ""
                }`}
              >
                <Button>Continue to payment</Button>
              </Link>
            )}
            <Link href={catalogHrefForProgram(course)}>
              <Button variant="ghost">Cancel</Button>
            </Link>
          </div>
        </div>
      )}
    </MarketingShell>
  );
}
