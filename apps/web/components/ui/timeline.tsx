import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";
import type { ApplicationStatus } from "@prisma/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type EventItem = {
  id: string;
  toStatus: ApplicationStatus;
  fromStatus: ApplicationStatus | null;
  note: string | null;
  createdAt: Date;
  actor?: { name: string } | null;
};

export function StatusTimeline({
  events,
  currentStatus,
}: {
  events: EventItem[];
  currentStatus: ApplicationStatus;
}) {
  const ordered = [...events].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  if (!ordered.length) {
    return (
      <p className="text-sm text-fg-muted">
        No timeline events yet. Current status: {APPLICATION_STATUS_LABELS[currentStatus]}
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {ordered.map((event, index) => {
        const isLast = index === ordered.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "mt-1 h-2.5 w-2.5 rounded-full border-2",
                  isLast ? "border-fg bg-fg" : "border-border-strong bg-bg-elevated",
                )}
              />
              {!isLast ? <span className="w-px flex-1 bg-border mt-1" /> : null}
            </div>
            <div className="min-w-0 flex-1 -mt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-medium text-fg">
                  {APPLICATION_STATUS_LABELS[event.toStatus]}
                </span>
                <span className="text-xs text-fg-muted">
                  {format(event.createdAt, "MMM d, yyyy · HH:mm")}
                </span>
              </div>
              {event.actor?.name ? (
                <p className="text-xs text-fg-muted mt-0.5">by {event.actor.name}</p>
              ) : null}
              {event.note ? (
                <p className="text-sm text-fg-muted mt-1">{event.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
