import { createForumCategoryAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminForumsPage() {
  const session = await requireCapability("manageContent");
  const categories = await prisma.forumCategory.findMany({
    where: { organizationId: session.user.organizationId },
    include: { _count: { select: { threads: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader title="Forums" description="Discussion categories for students." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form action={createForumCategoryAction} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" placeholder="optional" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit">Add category</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="text-sm border-b border-border py-2 flex justify-between">
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-fg-muted"> /{c.slug}</span>
                </span>
                <span className="text-fg-muted">{c._count.threads} threads</span>
              </li>
            ))}
            {categories.length === 0 ? <p className="text-sm text-fg-muted">No categories.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
