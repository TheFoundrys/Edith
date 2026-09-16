import Link from "next/link";
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
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        take: 8,
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
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                required
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required rows={4} />
            </div>
            <Button type="submit" disabled={categories.length === 0}>
              Post
            </Button>
          </form>
        </Panel>
        <Panel className="p-5 space-y-6">
          {categories.map((category) => (
            <div key={category.id}>
              <h3 className="font-medium text-fg">{category.name}</h3>
              <ul className="mt-2 space-y-2">
                {category.threads.map((thread) => (
                  <li key={thread.id} className="text-sm border-b border-border pb-2">
                    <Link
                      href={`/student/forums/${thread.id}`}
                      className="font-medium hover:underline"
                    >
                      {thread.title}
                    </Link>
                    <span className="block text-xs text-fg-muted">
                      {thread.author.name} · {thread.replyCount} replies
                    </span>
                  </li>
                ))}
                {category.threads.length === 0 ? (
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
