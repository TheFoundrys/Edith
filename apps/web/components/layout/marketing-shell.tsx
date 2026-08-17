import { BrandMark } from "@/components/layout/brand-mark";
import { SiteNav } from "@/components/layout/home-header";
import { PeakArtBackdrop } from "@/components/layout/peak-art-backdrop";
import { SiteFooter } from "@/components/layout/site-footer";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";

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
      <header className="min-h-14 py-2 border-b border-border bg-bg-elevated/90 backdrop-blur px-5 sm:px-8 flex items-center justify-between">
        <BrandMark />
        <SiteNav
          loggedIn={Boolean(workspaceHref)}
          workspaceHref={workspaceHref ?? undefined}
          workspaceLabel={
            session?.user && isStaffRole(session.user.role)
              ? "Workspace"
              : "Continue learning"
          }
        />
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
