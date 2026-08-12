import { upsertPaymentSettingsAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminPaymentSettingsPage() {
  const session = await requireCapability("managePricing");
  const settings = await prisma.paymentSettings.findUnique({
    where: { organizationId: session.user.organizationId },
  });

  return (
    <div>
      <PageHeader title="Payment settings" description="GST, fees, and provider toggles." />
      <Panel className="p-5 max-w-lg">
        <form action={upsertPaymentSettingsAction} className="space-y-3">
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="stripeEnabled" defaultChecked={settings?.stripeEnabled} />
            Stripe enabled
          </label>
          <Button type="submit">Save settings</Button>
        </form>
      </Panel>
    </div>
  );
}
