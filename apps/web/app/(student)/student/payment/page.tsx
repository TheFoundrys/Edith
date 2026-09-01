import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { paymentPurposeLabel } from "@/lib/payments/invoice";
import {
  getStudentPaidPayments,
  paymentProgramTitle,
} from "@/lib/payments/student-transactions";
import { coursePrice } from "@/lib/programs/pricing";
import { formatCurrency } from "@/lib/utils";

function formatPaidDate(date: Date | null | undefined, fallback: Date) {
  const value = date ?? fallback;
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StudentPaymentPage() {
  const session = await requireStudent();

  const [courses, enrollments, transactions] = await Promise.all([
    prisma.program.findMany({
      where: {
        organizationId: session.user.organizationId,
        status: "PUBLISHED",
      },
      orderBy: { title: "asc" },
    }),
    prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        organizationId: session.user.organizationId,
      },
      select: {
        programId: true,
        status: true,
        payments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true },
        },
      },
    }),
    getStudentPaidPayments(session.user.id, session.user.organizationId),
  ]);

  const activeIds = new Set(
    enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.programId),
  );
  const pendingPaymentIds = new Set(
    enrollments
      .filter(
        (e) =>
          e.status === "PENDING" &&
          !e.payments.some((payment) => payment.status === "PAID"),
      )
      .map((e) => e.programId),
  );

  const payable = courses.filter((c) => {
    if (activeIds.has(c.id)) return false;
    if (pendingPaymentIds.has(c.id)) return true;
    return coursePrice(c) > 0;
  });

  return (
    <div className="space-y-10">
      <PageHeader
        title="Payments"
        description="Complete fee payment to unlock learning and download invoices for past purchases."
        actions={
          <Link href="/student/enroll">
            <Button variant="secondary" size="sm">
              Browse courses
            </Button>
          </Link>
        }
      />

      <section>
        <h2 className="text-sm font-medium mb-3">Payments due</h2>
        {payable.length === 0 ? (
          <EmptyState
            title="No payments due"
            description={
              activeIds.size > 0 || pendingPaymentIds.size > 0
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
                  <h3 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg">
                    {course.title}
                  </h3>
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
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">Transaction history</h2>
        {transactions.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Completed payments will appear here with downloadable invoices."
          />
        ) : (
          <Panel className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-fg-muted">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Programme</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((payment) => (
                  <tr key={payment.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatPaidDate(payment.paymentDate, payment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{paymentProgramTitle(payment)}</p>
                      {payment.invoiceId ? (
                        <p className="text-xs text-fg-muted">{payment.invoiceId}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-fg-muted">
                      {paymentPurposeLabel(payment.purpose)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/student/payment/invoices/${payment.id}`}
                        className="text-sm underline"
                      >
                        View invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </section>
    </div>
  );
}
