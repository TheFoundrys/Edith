import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HomeSocialProof } from "@/components/marketing/home-social-proof";
import { APP_HEADLINE, APP_NAME, APP_SUBHEAD } from "@/lib/brand";
import type { HomePageData } from "@/lib/marketing/home-data";

export function HomeHero({
  continueHref,
  socialProof,
}: {
  continueHref: string;
  socialProof: HomePageData["socialProof"];
}) {
  return (
    <div>
      <p className="home-wordmark">{APP_NAME}</p>
      <div className="home-hero-rule" aria-hidden />
      <h1 className="home-headline">{APP_HEADLINE}</h1>
      <p className="home-tagline max-w-md">{APP_SUBHEAD}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/courses">
          <Button className="home-cta-primary h-11 px-5 text-sm">
            Browse courses
          </Button>
        </Link>
        <Link href={continueHref}>
          <Button
            variant="secondary"
            className="home-cta-secondary h-11 px-5 text-sm"
          >
            Continue course
          </Button>
        </Link>
      </div>
      <HomeSocialProof socialProof={socialProof} />
    </div>
  );
}
