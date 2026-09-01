import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability, isSuperAdmin } from "@/lib/auth/session";
import {
  getAdminPayments,
  paymentPayerLabel,
  paymentProgramTitle,
} from "@/lib/payments/admin-transactions";
import { paymentPurposeLabel } from "@/lib/payments/invoice";
import { ROUTES } from "@/lib/urls";
import { formatCurrency } from "@/lib/utils";

function formatPaidDate(date: Date | null | undefined, fallback: Date) {
  const value = date ?? fallback;
  return value.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "PENDING" || status === "CREATED") return "warning" as const;
  return "neutral" as const;
}

export default async function AdminPaymentsPage() {
  const session = await requireCapability("managePricing");
  const payments = await getAdminPayments(session.user.organizationId);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payment transactions across course fees and application fees."
        actions={
          isSuperAdmin(session.user.role) ? (
            <Link href="/admin/payment-settings">
              <Button variant="secondary" size="sm">
                Payment settings
              </Button>
            </Link>
          ) : undefined
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Transactions will appear here when students pay course or application fees."
        />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Payer</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
                <th className="px-4 py-3 font-medium text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPaidDate(payment.paymentDate, payment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{paymentPayerLabel(payment)}</td>
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
                    <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === "PAID" ? (
                      <Link
                        href={ROUTES.adminInvoice(payment.id)}
                        className="text-sm underline"
                      >
                        View invoice
                      </Link>
                    ) : (
                      <span className="text-fg-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
