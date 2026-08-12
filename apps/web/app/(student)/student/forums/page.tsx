import { createForumThreadAction } from "@/lib/actions/compass-modules";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function StudentForumsPage() {
  const session = await requireStudent();
  const categories = await prisma.forumCategory.findMany({
    where: { organizationId: session.user.organizationId, isActive: true },
    include: {
      threads: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: { select: { name: true } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader title="Forums" description="Ask questions and discuss coursework." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <h2 className="font-display text-lg text-brand mb-3">New thread</h2>
          <form action={createForumThreadAction} className="space-y-3">
            <div>
              <Label htmlFor="categoryId">Category ID</Label>
              <Input id="categoryId" name="categoryId" list="forum-cats" required />
              <datalist id="forum-cats">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required rows={4} />
            </div>
            <Button type="submit">Post</Button>
          </form>
        </Panel>
        <Panel className="p-5 space-y-6">
          {categories.map((c) => (
            <div key={c.id}>
              <h3 className="font-medium text-fg">{c.name}</h3>
              <ul className="mt-2 space-y-2">
                {c.threads.map((t) => (
                  <li key={t.id} className="text-sm border-b border-border pb-2">
                    <span className="font-medium">{t.title}</span>
                    <span className="block text-xs text-fg-muted">
                      {t.author.name} · {t.replyCount} replies
                    </span>
                  </li>
                ))}
                {c.threads.length === 0 ? (
                  <p className="text-xs text-fg-muted">No threads yet.</p>
                ) : null}
              </ul>
            </div>
          ))}
          {categories.length === 0 ? (
            <p className="text-sm text-fg-muted">Forums are not set up yet.</p>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
