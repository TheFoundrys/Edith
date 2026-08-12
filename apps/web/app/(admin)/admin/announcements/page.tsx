import Link from "next/link";
import { createAnnouncementAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminAnnouncementsPage() {
  const session = await requireCapability("manageContent");
  const items = await prisma.announcement.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="Announcements" description="Org-wide notices for students." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <h2 className="font-display text-xl text-brand mb-4">New announcement</h2>
          <form action={createAnnouncementAction} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea id="content" name="content" required rows={4} />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" name="priority" defaultValue="INFO" placeholder="INFO | IMPORTANT | CRITICAL" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publishNow" defaultChecked /> Publish now
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPinned" /> Pin
            </label>
            <Button type="submit">Create</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-display text-xl text-brand mb-4">Recent</h2>
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="border-b border-border pb-3">
                <p className="font-medium text-fg">{a.title}</p>
                <p className="text-sm text-fg-muted line-clamp-2">{a.content}</p>
                <p className="text-xs text-fg-muted mt-1">
                  {a.priority} · {a.author.name}
                  {a.publishedAt ? ` · published` : " · draft"}
                </p>
              </li>
            ))}
            {items.length === 0 ? <p className="text-sm text-fg-muted">No announcements yet.</p> : null}
          </ul>
          <p className="mt-4 text-sm">
            <Link href="/student/announcements" className="text-brand underline">
              Student view
            </Link>
          </p>
        </Panel>
      </div>
    </div>
  );
}
