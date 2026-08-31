import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LmsMetric = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
};

export function LmsMetricsRail({
  metrics,
  className,
}: {
  metrics: LmsMetric[];
  className?: string;
}) {
  return (
    <div className={cn("lms-metrics-rail", className)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div
            key={metric.label}
            className={cn("lms-metric", index > 0 && "lms-metric-divided")}
          >
            <div className="lms-metric-icon" aria-hidden>
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="lms-metric-value">{metric.value}</p>
              <p className="lms-metric-label">{metric.label}</p>
              {metric.hint ? (
                <p className="mt-0.5 text-[11px] text-fg-muted">{metric.hint}</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
