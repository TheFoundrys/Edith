import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Compact brand mark for nav/auth. */
export function BrandMark({
  href = "/",
  className,
  showTagline = false,
}: {
  href?: string;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex flex-col", className)}>
      <span className="font-display text-lg tracking-tight text-brand">
        {APP_NAME}
      </span>
      {showTagline ? (
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {APP_TAGLINE}
        </span>
      ) : null}
    </Link>
  );
}
