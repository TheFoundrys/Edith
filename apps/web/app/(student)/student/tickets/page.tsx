import Link from "next/link";
import { createTicketAction } from "@/lib/actions/compass-modules";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";

export default async function StudentTicketsPage() {
  const session = await requireStudent();
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="Support" description="Open a ticket for billing or technical help." />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <form action={createTicketAction} className="space-y-3">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea id="content" name="content" required rows={4} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" defaultValue="OTHER" />
            </div>
            <Button type="submit">Submit ticket</Button>
          </form>
        </Panel>
        <Panel className="p-5">
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="flex justify-between items-center border-b border-border py-2">
                <Link href={`/student/tickets/${t.id}`} className="text-brand hover:underline text-sm">
                  {t.subject}
                </Link>
                <Badge>{t.status}</Badge>
              </li>
            ))}
            {tickets.length === 0 ? <p className="text-sm text-fg-muted">No tickets yet.</p> : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
