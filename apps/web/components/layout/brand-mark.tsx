import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Compact brand mark for nav/auth. Pass `onClick` to use as a control (e.g. expand sidebar). */
export function BrandMark({
  href = "/",
  className,
  onClick,
  ariaLabel,
}: {
  href?: string;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const wordmark = (
    <span className="brand-wordmark text-lg tracking-tight">{APP_NAME}</span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? "Expand sidebar"}
        className={cn(
          "inline-flex flex-row items-center rounded-[var(--radius-sm)] text-left transition-colors hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          className,
        )}
      >
        {wordmark}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex flex-row items-center", className)}
    >
      {wordmark}
    </Link>
  );
}
