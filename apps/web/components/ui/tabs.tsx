import Link from "next/link";
import { cn } from "@/lib/utils";

export type TabItem = {
  value: string;
  label: string;
  /** Optional count rendered beside the label. */
  count?: number;
};

/**
 * Link-based tabs driven by a URL search param, so the active tab survives
 * reloads and stays shareable. Uses the same ARIA shape as the student
 * application form's section tabs.
 */
export function Tabs({
  items,
  active,
  hrefFor,
  label = "Views",
}: {
  items: TabItem[];
  active: string;
  hrefFor: (value: string) => string;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap items-center gap-1 border-b border-border"
    >
      {items.map((item) => {
        const selected = item.value === active;
        return (
          <Link
            key={item.value}
            href={hrefFor(item.value)}
            role="tab"
            aria-selected={selected}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg",
              selected
                ? "border-accent font-medium text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {item.label}
            {item.count === undefined ? null : (
              <span className="ml-1.5 tabular-nums text-fg-muted">{item.count}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
