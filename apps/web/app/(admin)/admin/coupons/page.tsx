import { createCouponAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminCouponsPage() {
  const session = await requireCapability("managePricing");
  const coupons = await prisma.coupon.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Coupons" description="Discount codes for enrollments." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form action={createCouponAction} className="space-y-3">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input id="code" name="code" required />
            </div>
            <div>
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" name="type" defaultValue="PERCENTAGE" />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires</Label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" required />
            </div>
            <div>
              <Label htmlFor="maxUses">Max uses (0 = unlimited)</Label>
              <Input id="maxUses" name="maxUses" type="number" defaultValue={0} />
            </div>
            <Button type="submit">Create coupon</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {coupons.map((c) => (
              <li key={c.id} className="flex justify-between text-sm border-b border-border py-2">
                <span className="font-mono text-brand">{c.code}</span>
                <span className="text-fg-muted">
                  {c.type} {c.value} · used {c.usedCount}/{c.maxUses || "∞"}
                </span>
              </li>
            ))}
            {coupons.length === 0 ? <p className="text-sm text-fg-muted">No coupons.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
