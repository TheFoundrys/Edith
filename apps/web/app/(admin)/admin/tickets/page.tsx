import Link from "next/link";
import { requireCapability } from "@/lib/auth/session";
import { listAdminTickets } from "@/lib/tickets/queries";
import { PageHeader, Panel } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";

export default async function AdminTicketsPage() {
  const session = await requireCapability("manageApplications");
  const tickets = await listAdminTickets(session.user.organizationId);

  return (
    <div>
      <PageHeader title="Support tickets" description="Student support inbox." />
      <Panel className="p-5">
        <ul className="divide-y divide-border">
          {tickets.map((ticket) => (
            <li key={ticket.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <Link href={`/admin/tickets/${ticket.id}`} className="font-medium text-brand hover:underline">
                  {ticket.subject}
                </Link>
                <p className="text-xs text-fg-muted">
                  {ticket.user?.name ?? "Student"} · {ticket.category ?? "OTHER"} ·{" "}
                  {ticket.priority ?? "MEDIUM"}
                </p>
              </div>
              <Badge>{ticket.status}</Badge>
            </li>
          ))}
          {tickets.length === 0 ? <p className="text-sm text-fg-muted">No tickets.</p> : null}
        </ul>
      </Panel>
    </div>
  );
}
