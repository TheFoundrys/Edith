import Link from "next/link";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-1 sm:gap-2">
      <Link href="/courses" className="nav-link">
        Courses
      </Link>
      {loggedIn ? (
        <Link href={workspaceHref}>
          <Button size="sm">{workspaceLabel}</Button>
        </Link>
      ) : (
        <>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Register</Button>
          </Link>
        </>
      )}
    </div>
  );
}

/**
 * Transparent overlay header for the pages built on the hero backdrop (home,
 * login). Nav is the same set as MarketingShell so the chrome never drifts.
 */
export function HomeHeader({
  loggedIn = false,
  workspaceHref,
  workspaceLabel,
}: {
  loggedIn?: boolean;
  workspaceHref?: string;
  workspaceLabel?: string;
}) {
  return (
    <header className="home-header absolute inset-x-0 top-0 z-20 min-h-14 py-2 px-5 sm:px-8 flex items-center justify-between peak-fade">
      <BrandMark />
      <SiteNav
        loggedIn={loggedIn}
        workspaceHref={workspaceHref}
        workspaceLabel={workspaceLabel}
      />
    </header>
  );
}
