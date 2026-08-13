import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; enrollment?: string; pending?: string }>;
}) {
  const {
    course: courseId,
    enrollment: enrollmentId,
    pending,
  } = await searchParams;

  const course = courseId
    ? await prisma.program.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, requiresCrmCallback: true },
      })
    : null;

  const enrollment = enrollmentId
    ? await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        select: { id: true, status: true, programId: true },
      })
    : null;

  const awaitingCrm =
    pending === "crm" ||
    (enrollment?.status === "PENDING" && course?.requiresCrmCallback) ||
    (enrollment?.status === "PENDING" && !course && Boolean(enrollmentId));

  return (
    <MarketingShell maxWidth="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {awaitingCrm ? "Payment received" : "Payment successful"}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {awaitingCrm
          ? "Awaiting CRM confirmation"
          : `You're enrolled${course ? ` in ${course.title}` : ""}`}
      </h1>
      <p className="mt-3 text-sm text-fg-muted">
        {awaitingCrm
          ? `Your payment went through${course ? ` for ${course.title}` : ""}. Learning unlocks after CRM confirms your enrollment.`
          : "Your payment went through. Open your dashboard to start learning."}
        {enrollmentId ? ` Enrollment reference: ${enrollmentId.slice(0, 8)}…` : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/student/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
        {course ? (
          awaitingCrm ? (
            <Link href={`/student/my-courses/${course.id}?pending=crm`}>
              <Button variant="secondary">View status</Button>
            </Link>
          ) : (
            <Link href={`/student/learning/${course.id}`}>
              <Button variant="secondary">Start learning</Button>
            </Link>
          )
        ) : (
          <Link href="/student/my-courses">
            <Button variant="secondary">My courses</Button>
          </Link>
        )}
      </div>
    </MarketingShell>
  );
}
