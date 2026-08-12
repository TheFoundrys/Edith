import Link from "next/link";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHeader } from "@/components/layout/home-header";
import { HomeEmblemArt } from "@/components/layout/home-emblem-art";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

export default async function HomePage() {
  const session = await auth();
  const loggedIn =
    Boolean(session?.user?.id) && session?.error !== "InvalidSession";
  const href = loggedIn
    ? isStaffRole(session!.user.role)
      ? "/admin"
      : "/student/dashboard"
    : "/courses";

  return (
    <div className="home-page min-h-full flex flex-col">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <HomeHeader ctaHref="/login" ctaLabel="Sign in" />

      <main
        id="main-content"
        className="relative flex-1 min-h-[100svh] flex flex-col peak-atmosphere"
      >
        <HomeEmblemArt />

        <div className="home-hero relative flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-12 max-w-7xl w-full mx-auto py-28 sm:py-32">
          <h1 className="home-wordmark peak-rise">{APP_NAME}!</h1>
          <div className="home-hero-rule peak-rise" aria-hidden />
          <p className="home-tagline max-w-xl peak-rise-delay">
            {APP_TAGLINE}
          </p>
          <p className="mt-5 max-w-md text-base sm:text-lg text-fg-muted leading-relaxed peak-rise-delay-2">
            Deep tech courses in AI, cyber, data, blockchain, and quantum —
            enroll, learn, and finish.
          </p>
          <div className="mt-9 flex flex-wrap gap-3 peak-rise-delay-2">
            <Link href="/courses">
              <Button className="home-cta-primary h-11 px-5 text-sm">
                Browse courses
              </Button>
            </Link>
            <Link href={loggedIn ? href : "/login"}>
              <Button variant="secondary" className="home-cta-secondary h-11 px-5 text-sm">
                {loggedIn ? "Continue learning" : "Sign in"}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
