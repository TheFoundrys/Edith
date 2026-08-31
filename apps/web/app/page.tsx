import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { getHomePageData } from "@/lib/marketing/home-data";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/home-header";
import { HomeEmblemArt } from "@/components/layout/home-emblem-art";
import { HomeHeroBackdrop } from "@/components/layout/home-hero-backdrop";
import { HomeHero } from "@/components/layout/home-hero";
import { HomeFeatureBar } from "@/components/marketing/home-feature-bar";
import { HomeCourseShowcase } from "@/components/marketing/home-featured-course-card";
import { HomeStatsBar } from "@/components/marketing/home-stats-bar";
import { HomeTestimonials } from "@/components/marketing/home-testimonials";
import { HomeCtaBand } from "@/components/marketing/home-cta-band";

export default async function HomePage() {
  const [session, homeData] = await Promise.all([auth(), getHomePageData()]);
  const loggedIn =
    Boolean(session?.user?.id) && session?.error !== "InvalidSession";
  const href = loggedIn
    ? isStaffRole(session!.user.role)
      ? "/admin"
      : "/student/dashboard"
    : "/courses";

  const continueHref = loggedIn
    ? href
    : "/login";

  return (
    <div className="home-page min-h-full flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <SiteHeader
        loggedIn={loggedIn}
        workspaceHref={href}
        workspaceLabel={
          isStaffRole(session?.user?.role) ? "Workspace" : "Continue learning"
        }
        variant="overlay"
      />

      <main id="main-content" className="relative flex-1 flex flex-col">
        <div className="home-hero-bridge">
          <section className="home-hero-viewport peak-atmosphere">
            <HomeHeroBackdrop />

            <div className="home-container home-hero-shell">
              <div className="home-hero-copy">
                <HomeHero
                  continueHref={continueHref}
                  socialProof={homeData.socialProof}
                />
              </div>
              <HomeEmblemArt placement="inline" />
            </div>
          </section>

          <HomeFeatureBar highlights={homeData.featureHighlights} />
        </div>

        <div className="home-landing-body">
          <HomeCourseShowcase courses={homeData.featuredCourses} />
          <HomeStatsBar stats={homeData.stats} />
          <HomeTestimonials items={homeData.testimonials} />
          <HomeCtaBand loggedIn={loggedIn} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
