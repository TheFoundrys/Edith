import { notFound } from "next/navigation";
import { replyTicketAction } from "@/lib/actions/compass-modules";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageApplications");
  const ticket = await prisma.ticket.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });
  if (!ticket) notFound();

  return (
    <div>
      <PageHeader title={ticket.subject} description={`${ticket.user.name} · ${ticket.status}`} />
      <Panel className="p-5 space-y-4 mb-6">
        {ticket.messages.map((m) => (
          <div key={m.id} className="border-b border-border pb-3">
            <p className="text-xs text-fg-muted">
              {m.user.name} {m.isStaff ? "(staff)" : ""} · {m.createdAt.toISOString()}
            </p>
            <p className="text-sm text-fg mt-1 whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </Panel>
      <Panel className="p-5">
        <form action={replyTicketAction.bind(null, ticket.id)} className="space-y-3">
          <div>
            <Label htmlFor="content">Reply</Label>
            <Textarea id="content" name="content" required rows={3} />
          </div>
          <div>
            <Label htmlFor="status">Set status</Label>
            <Input id="status" name="status" placeholder="OPEN | IN_PROGRESS | RESOLVED | CLOSED" />
          </div>
          <Button type="submit">Send reply</Button>
        </form>
      </Panel>
    </div>
  );
}
