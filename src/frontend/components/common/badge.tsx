import { cn } from "@frontend/utils";

/** Monochrome status tones — weight/border only (no color fills). */
const tones = {
  neutral: "bg-bg text-fg-muted border-border",
  success: "bg-fg text-accent-fg border-fg",
  warning: "bg-bg-elevated text-fg border-border-strong",
  danger: "bg-bg-elevated text-fg border-fg",
  info: "bg-bg text-fg border-border-strong",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
