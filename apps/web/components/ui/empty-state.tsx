import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 border border-dashed border-border-strong rounded-[var(--radius)] px-6 py-10",
        className,
      )}
    >
      <h3 className="text-sm font-medium text-fg">{title}</h3>
      {description ? <p className="text-sm text-fg-muted max-w-md">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
