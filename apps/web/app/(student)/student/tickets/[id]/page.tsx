import { notFound } from "next/navigation";
import { replyTicketAction } from "@/lib/actions/compass-modules";
import { requireStudent } from "@/lib/auth/session";
import { loadStudentTicketDetail } from "@/lib/tickets/queries";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function StudentTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStudent();
  const ticket = await loadStudentTicketDetail(session.user.id, id);
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader title={ticket.subject} description={ticket.status} />
      <Panel className="p-5 space-y-4 mb-6">
        {ticket.messages.map((message) => (
          <div key={message.id} className="border-b border-border pb-3">
            <p className="text-xs text-fg-muted">
              {message.user.name}
              {message.isStaff ? " (staff)" : ""}
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
      </Panel>
      <Panel className="p-5">
        <form action={replyTicketAction.bind(null, ticket.id)} className="space-y-3">
          <div>
            <Label htmlFor="content">Reply</Label>
            <Textarea id="content" name="content" required rows={3} />
          </div>
          <Button type="submit">Send</Button>
        </form>
      </Panel>
    </div>
  );
}
