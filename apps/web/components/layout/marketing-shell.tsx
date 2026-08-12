import Link from "next/link";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { PeakArtBackdrop } from "@/components/layout/peak-art-backdrop";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";

export async function MarketingShell({
  children,
  maxWidth = "max-w-4xl",
  showArt = true,
}: {
  children: React.ReactNode;
  maxWidth?: string;
  /** Decorative Peak art plane — turn off for dense reading pages. */
  showArt?: boolean;
}) {
  const session = await auth();
  const workspaceHref = session?.user
    ? isStaffRole(session.user.role)
      ? "/admin"
      : "/student/dashboard"
    : null;

  return (
    <div
      className={`min-h-full flex flex-col ${showArt ? "peak-atmosphere" : "bg-bg"}`}
    >
      {showArt ? <PeakArtBackdrop variant="marketing" /> : null}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="h-14 border-b border-border bg-bg-elevated/90 backdrop-blur px-5 sm:px-8 flex items-center justify-between">
        <BrandMark />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/courses"
            className="text-sm text-fg-muted hover:text-fg px-2.5 py-1.5 transition-colors"
          >
            Courses
          </Link>
          {workspaceHref ? (
            <Link href={workspaceHref}>
              <Button size="sm">Workspace</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
      </header>
      <main
        id="main-content"
        className={`${maxWidth} w-full mx-auto px-[var(--grid-pad)] py-[var(--grid-pad)] sm:py-[calc(var(--grid-pad)*1.25)] flex-1`}
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
