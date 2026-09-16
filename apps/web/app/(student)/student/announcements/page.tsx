import { listPublishedAnnouncements } from "@/lib/announcements/queries";
import { requireStudent } from "@/lib/auth/session";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function StudentAnnouncementsPage() {
  const session = await requireStudent();
  const items = await listPublishedAnnouncements(session.user.organizationId);

  return (
    <div>
      <PageHeader title="Announcements" description="Updates from your institution." />
      <Panel className="p-5">
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id} className="border-b border-border pb-4">
              <p className="font-medium text-fg">
                {a.isPinned ? "Pinned · " : ""}
                {a.title}
              </p>
              <p className="text-sm text-fg-muted mt-1 whitespace-pre-wrap">{a.content}</p>
            </li>
          ))}
          {items.length === 0 ? <p className="text-sm text-fg-muted">No announcements.</p> : null}
        </ul>
      </Panel>
    </div>
  );
}
