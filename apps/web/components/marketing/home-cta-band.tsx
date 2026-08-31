import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeCtaBand({ loggedIn }: { loggedIn: boolean }) {
  return (
    <section className="home-cta-band" aria-labelledby="home-cta-heading">
      <div className="home-container">
        <div className="home-cta-band-inner">
        <span className="home-cta-icon" aria-hidden>
          <GraduationCap className="h-8 w-8" strokeWidth={1.5} />
        </span>
        <div className="home-cta-copy">
          <h2 id="home-cta-heading" className="home-cta-title">
            Start learning on Edith today
          </h2>
          <p className="home-cta-lead">
            Browse live programmes, apply to intakes, and track progress in one
            workspace.
          </p>
        </div>
        <Link href={loggedIn ? "/student/dashboard" : "/register"}>
          <Button size="md" className="home-cta-button h-11 px-6">
            {loggedIn ? "Go to dashboard" : "Get started for free"}
          </Button>
        </Link>
        </div>
      </div>
    </section>
  );
}
