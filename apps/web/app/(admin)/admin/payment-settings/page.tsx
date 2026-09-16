import { createInstallmentAction } from "@/lib/actions/installments";
import { upsertPaymentSettingsAction } from "@/lib/actions/compass-modules";
import { requireSuperAdmin } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminPaymentSettingsPage() {
  redirectIfCompassAdminRoute();
  const session = await requireSuperAdmin();
  const [settings, installments] = await Promise.all([
    prisma.paymentSettings.findUnique({
      where: { organizationId: session.user.organizationId },
    }),
    prisma.installment.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { dueDate: "asc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment settings"
        description="GST, provider toggles, and installment plans."
        actions={
          <Link href="/admin/transactions" className="text-sm text-fg-muted underline">
            All transactions
          </Link>
        }
      />

      <Panel className="p-5 max-w-lg">
        <form action={upsertPaymentSettingsAction} className="space-y-3">
          <p className="text-sm text-fg-muted">
            These values are applied to new course checkout quotes. Set{" "}
            <code className="text-xs">PAYMENT_ADAPTER=stripe</code> or{" "}
            <code className="text-xs">razorpay</code> in the server environment.
          </p>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={settings?.currency ?? "INR"} />
          </div>
          <div>
            <Label htmlFor="gstPercent">GST %</Label>
            <Input
              id="gstPercent"
              name="gstPercent"
              type="number"
              step="0.01"
              defaultValue={settings?.gstPercent ?? 18}
            />
          </div>
          <div>
            <Label htmlFor="convenienceFeePercent">Convenience fee %</Label>
            <Input
              id="convenienceFeePercent"
              name="convenienceFeePercent"
              type="number"
              step="0.01"
              defaultValue={settings?.convenienceFeePercent ?? 0}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="razorpayEnabled"
              defaultChecked={settings?.razorpayEnabled}
            />
            Razorpay enabled
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="stripeEnabled"
              defaultChecked={settings?.stripeEnabled}
            />
            Stripe enabled
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Panel>

      <Panel className="p-5 max-w-lg space-y-4">
        <div>
          <h2 className="font-display text-lg text-brand">Installment plan</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Create a tuition installment for a student by email. They can pay it from
            Transactions.
          </p>
        </div>
        <form action={createInstallmentAction} className="space-y-3">
          <div>
            <Label htmlFor="email">Student email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Term 1 tuition" required />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </div>
          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <Button type="submit">Create installment</Button>
        </form>
      </Panel>

      {installments.length > 0 ? (
        <Panel className="p-5 overflow-x-auto">
          <h2 className="text-sm font-medium mb-3">Recent installments</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Paid</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Due</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <tr key={installment.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4">{installment.title}</td>
                  <td className="py-2 pr-4">{installment.amount}</td>
                  <td className="py-2 pr-4">{installment.paidAmount}</td>
                  <td className="py-2 pr-4">{installment.status}</td>
                  <td className="py-2">
                    {installment.dueDate?.toLocaleDateString("en-IN") ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </div>
  );
}
