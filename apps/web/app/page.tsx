import Link from "next/link";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeTopicArt } from "@/components/layout/home-topic-art";
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
      <header className="home-header absolute inset-x-0 top-0 z-20 h-14 px-5 sm:px-8 flex items-center justify-between peak-fade">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-brand"
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
          {loggedIn ? (
            <Link href={href}>
              <Button size="sm">Open workspace</Button>
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
        className="relative flex-1 min-h-[100svh] flex flex-col peak-atmosphere"
      >
        <HomeTopicArt />
        <div className="home-depth" aria-hidden />

        <div className="home-hero relative flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-12 max-w-7xl w-full mx-auto py-28 sm:py-32">
          <h1 className="font-display text-13xl font-bold leading-none tracking-tight text-brand peak-rise">
            {APP_NAME}
          </h1>
          <div className="home-hero-rule peak-rise" aria-hidden />
          <p className="mt-5 max-w-xl font-display text-2xl sm:text-3xl lg:text-4xl leading-snug text-brand peak-rise-delay">
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
