import "server-only";

import { PeakArtBackdrop } from "@/components/layout/peak-art-backdrop";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeaderWithSession } from "@/components/layout/site-header-with-session";

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
  return (
    <div
      className={`min-h-full flex flex-col ${showArt ? "peak-atmosphere" : "bg-bg"}`}
    >
      {showArt ? <PeakArtBackdrop variant="marketing" /> : null}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeaderWithSession variant="sticky" />
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
