import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { MarketingHeaderSearch } from "@/components/layout/marketing-header-search";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteNav({
  loggedIn = false,
  workspaceHref = "/student/dashboard",
  workspaceLabel = "Continue learning",
}: {
  loggedIn?: boolean;
  workspaceHref?: string;
  workspaceLabel?: string;
}) {
  return (
    <div className="site-nav">
      <nav className="site-nav-links" aria-label="Catalog">
        <Link href="/courses" className="nav-link">
          Courses
        </Link>
        <Link href="/programs" className="nav-link">
          Programs
        </Link>
      </nav>

      <Suspense
        fallback={
          <div className="marketing-header-search marketing-header-search-fallback" />
        }
      >
        <MarketingHeaderSearch />
      </Suspense>

      <div className="site-nav-actions">
        {loggedIn ? (
          <Link href={workspaceHref}>
            <Button size="sm">{workspaceLabel}</Button>
          </Link>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign up</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export type SiteHeaderProps = {
  loggedIn?: boolean;
  workspaceHref?: string;
  workspaceLabel?: string;
  /** Overlay on hero pages; sticky bar on inner pages. */
  variant?: "overlay" | "sticky";
  className?: string;
};

/** Shared Edith header — same logo, nav, search, and auth actions everywhere. */
export function SiteHeader({
  loggedIn = false,
  workspaceHref = "/student/dashboard",
  workspaceLabel = "Continue learning",
  variant = "sticky",
  className,
}: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "home-header marketing-header z-20 py-2 peak-fade",
        variant === "overlay"
          ? "absolute inset-x-0 top-0"
          : "sticky top-0 border-b border-border bg-bg-elevated/90 backdrop-blur supports-[backdrop-filter]:bg-bg-elevated/80",
        className,
      )}
    >
      <div className="marketing-header-inner home-header-inner">
        <BrandMark className="site-header-brand" />
        <SiteNav
          loggedIn={loggedIn}
          workspaceHref={workspaceHref}
          workspaceLabel={workspaceLabel}
        />
      </div>
    </header>
  );
}

/** Homepage / auth hero overlay — alias for the overlay variant. */
export function HomeHeader(props: Omit<SiteHeaderProps, "variant">) {
  return <SiteHeader {...props} variant="overlay" />;
}
