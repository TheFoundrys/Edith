import Link from "next/link";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader, Panel } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";

export default async function AdminTicketsPage() {
  const session = await requireCapability("manageApplications");
  const tickets = await prisma.ticket.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return (
    <div>
      <PageHeader title="Support tickets" description="Student support inbox." />
      <Panel className="p-5">
        <ul className="divide-y divide-border">
          {tickets.map((t) => (
            <li key={t.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <Link href={`/admin/tickets/${t.id}`} className="font-medium text-brand hover:underline">
                  {t.subject}
                </Link>
                <p className="text-xs text-fg-muted">
                  {t.user.name} · {t.category} · {t.priority}
                </p>
              </div>
              <Badge>{t.status}</Badge>
            </li>
          ))}
          {tickets.length === 0 ? <p className="text-sm text-fg-muted">No tickets.</p> : null}
        </ul>
      </Panel>
    </div>
  );
}
