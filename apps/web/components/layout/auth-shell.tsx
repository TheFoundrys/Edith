import { BrandMark } from "@/components/layout/brand-mark";
import { HomeEmblemArt } from "@/components/layout/home-emblem-art";
import { HomeHeader } from "@/components/layout/home-header";
import { SiteFooter } from "@/components/layout/site-footer";

/**
 * Page frame shared by /login and /register: the emblem holds the right of the
 * composition, the card sits against the left gutter on the same grid as the
 * home hero. Keeping both pages on one shell stops them drifting apart.
 */
export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="home-page min-h-full flex flex-col">
      <HomeHeader />
      <div className="relative flex-1 min-h-[100svh] flex flex-col peak-atmosphere">
        <HomeEmblemArt animated={false} />
        <div className="flex-1 flex items-center justify-start w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-24 pb-16">
          <div className="auth-card w-full peak-rise">
            <BrandMark />
            <div className="auth-card-rule" aria-hidden />
            <h1 className="font-display text-3xl sm:text-[2.5rem] leading-[1.1] tracking-tight">
              {title}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-fg-muted leading-relaxed">
              {description}
            </p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
