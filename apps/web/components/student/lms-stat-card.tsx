import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function LmsStatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("lms-stat-card", className)}>
      <div className="lms-stat-icon" aria-hidden>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="lms-stat-value">{value}</p>
        <p className="lms-stat-label">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-fg-muted">{hint}</p> : null}
      </div>
    </div>
  );
}
