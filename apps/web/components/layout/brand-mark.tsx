import { APP_NAME, APP_PARENT_CREDIT } from "@/lib/brand";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Compact brand mark for nav/auth. */
export function BrandMark({
  href = "/",
  className,
  showParent = true,
}: {
  href?: string;
  className?: string;
  showParent?: boolean;
}) {
  return (
    <Link href={href} className={cn("inline-flex flex-col", className)}>
      <span className="brand-wordmark text-lg tracking-tight">
        {APP_NAME}
      </span>
      {showParent ? (
        <span className="brand-parent">{APP_PARENT_CREDIT}</span>
      ) : null}
    </Link>
  );
}
