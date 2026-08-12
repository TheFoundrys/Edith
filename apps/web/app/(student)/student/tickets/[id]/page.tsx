import { notFound } from "next/navigation";
import { replyTicketAction } from "@/lib/actions/compass-modules";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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
  const ticket = await prisma.ticket.findFirst({
    where: { id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader title={ticket.subject} description={ticket.status} />
      <Panel className="p-5 space-y-4 mb-6">
        {ticket.messages.map((m) => (
          <div key={m.id} className="border-b border-border pb-3">
            <p className="text-xs text-fg-muted">
              {m.user.name}
              {m.isStaff ? " (staff)" : ""}
            </p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{m.content}</p>
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
