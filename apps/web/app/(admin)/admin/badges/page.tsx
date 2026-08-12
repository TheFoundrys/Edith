import { awardBadgeAction, createBadgeAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminBadgesPage() {
  const session = await requireCapability("manageContent");
  const orgId = session.user.organizationId;
  const [badges, students] = await Promise.all([
    prisma.badge.findMany({ where: { organizationId: orgId }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({
      where: { organizationId: orgId, role: "STUDENT" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Badges" description="Achievements students can earn." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5 space-y-6">
          <form action={createBadgeAction} className="space-y-3">
            <h2 className="font-display text-lg text-brand">Create badge</h2>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit">Create</Button>
          </form>
          <form action={awardBadgeAction} className="space-y-3 border-t border-border pt-4">
            <h2 className="font-display text-lg text-brand">Award badge</h2>
            <div>
              <Label htmlFor="badgeId">Badge ID</Label>
              <Input id="badgeId" name="badgeId" list="badge-ids" required />
              <datalist id="badge-ids">
                {badges.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="userId">Student user ID</Label>
              <Input id="userId" name="userId" list="student-ids" required />
              <datalist id="student-ids">
                {students.map((s) => (
                  <option key={s.user.id} value={s.user.id}>
                    {s.user.name} ({s.user.email})
                  </option>
                ))}
              </datalist>
            </div>
            <Button type="submit">Award</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {badges.map((b) => (
              <li key={b.id} className="text-sm border-b border-border py-2">
                <span className="font-medium text-fg">{b.name}</span>
                <span className="block text-xs text-fg-muted font-mono">{b.id}</span>
              </li>
            ))}
            {badges.length === 0 ? <p className="text-sm text-fg-muted">No badges.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
