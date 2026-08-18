import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Compact brand mark for nav/auth. */
export function BrandMark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex flex-col", className)}>
      <span className="brand-wordmark text-lg tracking-tight">
        {APP_NAME}
      </span>
    </Link>
  );
}
