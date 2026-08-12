import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/brand";

/**
 * Transparent overlay header for the pages built on the hero backdrop (home,
 * login). The CTA is per-page so it never points at the current route.
 */
export function HomeHeader({
  ctaHref,
  ctaLabel,
}: {
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <header className="home-header absolute inset-x-0 top-0 z-20 h-14 px-5 sm:px-8 flex items-center justify-between peak-fade">
      <Link
        href="/"
        className="font-display brand-wordmark text-xl tracking-tight text-brand"
      >
        {APP_NAME}
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/courses"
          className="text-sm text-brand hover:text-brand/80 px-2.5 py-1.5 transition-colors"
        >
          Courses
        </Link>
        <Link href={ctaHref}>
          <Button size="sm">{ctaLabel}</Button>
        </Link>
      </div>
    </header>
  );
}
