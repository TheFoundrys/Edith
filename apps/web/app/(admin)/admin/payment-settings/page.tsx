import { upsertPaymentSettingsAction } from "@/lib/actions/compass-modules";
import { requireSuperAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminPaymentSettingsPage() {
  const session = await requireSuperAdmin();
  const settings = await prisma.paymentSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  return (
    <div>
      <PageHeader
        title="Payment settings"
        description="GST, fees, and provider toggles."
        actions={
          <Link href="/admin/payments" className="text-sm text-fg-muted underline">
            All payments
          </Link>
        }
      />
      <Panel className="p-5 max-w-lg">
        <form action={upsertPaymentSettingsAction} className="space-y-3">
          <p className="text-sm text-fg-muted">
            These values are applied to new course checkout quotes.
          </p>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue={settings?.currency ?? "INR"} />
          </div>
          <div>
            <Label htmlFor="gstPercent">GST %</Label>
            <Input id="gstPercent" name="gstPercent" type="number" step="0.01" defaultValue={settings?.gstPercent ?? 18} />
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
            <input type="checkbox" name="razorpayEnabled" defaultChecked={settings?.razorpayEnabled} />
            Razorpay enabled
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Panel>
    </div>
  );
}
