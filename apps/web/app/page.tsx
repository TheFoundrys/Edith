import Link from "next/link";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHeader } from "@/components/layout/home-header";
import { HomeEmblemArt } from "@/components/layout/home-emblem-art";
import { HomeHeroBackdrop } from "@/components/layout/home-hero-backdrop";
import { Button } from "@/components/ui/button";
import {
  APP_HEADLINE,
  APP_NAME,
  APP_SUBHEAD,
} from "@/lib/brand";

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
      <HomeHeader
        loggedIn={loggedIn}
        workspaceHref={href}
        workspaceLabel={
          isStaffRole(session?.user?.role) ? "Workspace" : "Continue learning"
        }
      />

      <main
        id="main-content"
        className="relative flex-1 flex flex-col peak-atmosphere min-h-[72svh]"
      >
        <HomeHeroBackdrop />

        <div className="home-hero relative flex-1 flex items-center justify-between gap-10 px-5 sm:px-8 lg:px-12 max-w-7xl w-full mx-auto py-20 sm:py-24">
          <div>
            <p className="home-wordmark peak-rise">{APP_NAME}</p>
            <div className="home-hero-rule peak-rise" aria-hidden />
            <h1 className="home-headline peak-rise-delay">{APP_HEADLINE}</h1>
            <p className="home-tagline max-w-md peak-rise-delay">
              {APP_SUBHEAD}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 peak-rise-delay-2">
              <Link href="/courses">
                <Button className="home-cta-primary h-11 px-5 text-sm">
                  Browse courses
                </Button>
              </Link>
              <Link href={loggedIn ? href : "/login"}>
                <Button
                  variant="secondary"
                  className="home-cta-secondary h-11 px-5 text-sm"
                >
                  {loggedIn ? "Continue learning" : "Sign in"}
                </Button>
              </Link>
            </div>
          </div>
          <HomeEmblemArt placement="inline" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
