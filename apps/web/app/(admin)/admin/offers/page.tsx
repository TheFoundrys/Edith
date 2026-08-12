import { createProgramOfferAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminOffersPage() {
  const session = await requireCapability("managePricing");
  const orgId = session.user.organizationId;
  const [offers, programs, students] = await Promise.all([
    prisma.programOffer.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        program: { select: { name: true } },
      },
    }),
    prisma.program.findMany({ where: { organizationId: orgId }, select: { id: true, name: true } }),
    prisma.membership.findMany({
      where: { organizationId: orgId, role: "STUDENT" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Program offers" description="Custom priced offers for applicants." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form action={createProgramOfferAction} className="space-y-3">
            <div>
              <Label htmlFor="userId">Student</Label>
              <Input id="userId" name="userId" list="offer-students" required />
              <datalist id="offer-students">
                {students.map((s) => (
                  <option key={s.user.id} value={s.user.id}>
                    {s.user.name}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="programId">Program</Label>
              <Input id="programId" name="programId" list="offer-programs" required />
              <datalist id="offer-programs">
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="customPrice">Custom price</Label>
              <Input id="customPrice" name="customPrice" type="number" step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="tokenRequired">Token required</Label>
              <Input id="tokenRequired" name="tokenRequired" type="number" step="0.01" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="discountAmount">Discount</Label>
              <Input id="discountAmount" name="discountAmount" type="number" step="0.01" defaultValue={0} />
            </div>
            <Button type="submit">Create offer</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {offers.map((o) => (
              <li key={o.id} className="text-sm border-b border-border py-2">
                <span className="font-medium">{o.program.name}</span> → {o.user.name}
                <span className="block text-fg-muted">
                  ₹{o.customPrice} · {o.status}
                </span>
              </li>
            ))}
            {offers.length === 0 ? <p className="text-sm text-fg-muted">No offers.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
