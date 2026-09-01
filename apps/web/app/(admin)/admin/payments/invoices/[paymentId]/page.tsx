import Link from "next/link";
import { notFound } from "next/navigation";
import { InvoicePrintButton } from "@/components/student/invoice-print-button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { APP_LOCKUP, APP_NAME } from "@/lib/brand";
import { prisma } from "@/lib/db";
import { paymentPayerLabel } from "@/lib/payments/admin-transactions";
import { ensureInvoiceId, paymentPurposeLabel } from "@/lib/payments/invoice";
import { paymentProgramTitle } from "@/lib/payments/student-transactions";
import { ROUTES } from "@/lib/urls";
import { formatCurrency } from "@/lib/utils";

function formatInvoiceDate(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminInvoicePage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const session = await requireCapability("managePricing");

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      organizationId: session.user.organizationId,
      status: "PAID",
    },
    include: {
      organization: { select: { title: true } },
      program: { select: { title: true } },
      enrollment: {
        select: {
          program: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
      },
      application: {
        select: {
          program: { select: { title: true } },
          applicant: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!payment) notFound();

  const invoiceId = payment.invoiceId ?? (await ensureInvoiceId(payment.id));
  const programTitle = paymentProgramTitle(payment);
  const paidOn = payment.paymentDate ?? payment.createdAt;
  const principal = payment.principalAmount ?? payment.amount;
  const discount = payment.discountAmount ?? 0;
  const gst = payment.gstAmount ?? 0;
  const convenienceFee = payment.convenienceFee ?? 0;
  const billedTo = paymentPayerLabel(payment);

  return (
    <div>
      <PageHeader
        title="Invoice"
        description={`${invoiceId ?? "Invoice"} · ${programTitle}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <InvoicePrintButton />
            <Link href={ROUTES.adminPayments} className="text-sm text-fg-muted underline">
              Back to payments
            </Link>
          </div>
        }
      />

      <Panel className="p-6 sm:p-8 max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
              {APP_LOCKUP}
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Tax invoice</h2>
            <p className="mt-1 text-sm text-fg-muted">{payment.organization.title}</p>
          </div>
          <div className="text-sm sm:text-right">
            <p>
              <span className="text-fg-muted">Invoice no.</span>{" "}
              <span className="font-medium">{invoiceId ?? "—"}</span>
            </p>
            <p className="mt-1">
              <span className="text-fg-muted">Date</span>{" "}
              <span className="font-medium">{formatInvoiceDate(paidOn)}</span>
            </p>
            <p className="mt-1">
              <span className="text-fg-muted">Status</span>{" "}
              <span className="font-medium text-emerald-700">Paid</span>
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
              Billed to
            </p>
            <p className="mt-2 font-medium">{billedTo}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
              Payment reference
            </p>
            <p className="mt-2 font-medium">
              {payment.providerPaymentId ?? payment.id.slice(0, 12)}
            </p>
            <p className="text-fg-muted capitalize">
              {payment.provider.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="py-2 pr-4 font-medium">Description</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 pr-4">
                  <p className="font-medium">{programTitle}</p>
                  <p className="text-fg-muted">{paymentPurposeLabel(payment.purpose)}</p>
                </td>
                <td className="py-3 text-right">
                  {formatCurrency(principal, payment.currency)}
                </td>
              </tr>
              {discount > 0 ? (
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-fg-muted">
                    Discount
                    {payment.couponCode ? ` (${payment.couponCode})` : ""}
                  </td>
                  <td className="py-3 text-right text-emerald-700">
                    −{formatCurrency(discount, payment.currency)}
                  </td>
                </tr>
              ) : null}
              {gst > 0 ? (
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-fg-muted">GST</td>
                  <td className="py-3 text-right">
                    {formatCurrency(gst, payment.currency)}
                  </td>
                </tr>
              ) : null}
              {convenienceFee > 0 ? (
                <tr className="border-b border-border">
                  <td className="py-3 pr-4 text-fg-muted">Convenience fee</td>
                  <td className="py-3 text-right">
                    {formatCurrency(convenienceFee, payment.currency)}
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-4 pr-4 font-semibold">Total paid</td>
                <td className="pt-4 text-right text-lg font-semibold">
                  {formatCurrency(payment.amount, payment.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-8 text-xs text-fg-muted leading-relaxed">
          Computer-generated invoice from {APP_NAME} for internal records and payer support.
        </p>
      </Panel>
    </div>
  );
}
