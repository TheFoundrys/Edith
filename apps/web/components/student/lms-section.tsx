import Link from "next/link";
import { cn } from "@/lib/utils";

export function LmsSection({
  title,
  actionHref,
  actionLabel = "View all",
  variant = "card",
  children,
  className,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: "card" | "inset" | "flush";
  children: React.ReactNode;
  className?: string;
}) {
  const surfaceClass =
    variant === "card"
      ? "lms-widget"
      : variant === "inset"
        ? "lms-panel-inset"
        : "lms-panel-flush";

  return (
    <section className={cn(surfaceClass, className)}>
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          variant === "card" && "border-b border-border pb-3",
          variant === "inset" && "pb-2",
          variant === "flush" && "pb-2",
        )}
      >
        <h2
          className={cn(
            "font-semibold text-fg",
            variant === "card" ? "text-sm" : "text-base tracking-tight",
          )}
        >
          {title}
        </h2>
        {actionHref ? (
          <Link href={actionHref} className="link-quiet text-xs">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className={cn(variant === "card" ? "pt-4" : "pt-3")}>{children}</div>
    </section>
  );
}
