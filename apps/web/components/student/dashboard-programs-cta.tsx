import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

export function DashboardProgramsCta() {
  return (
    <section className="dash-cta-banner" aria-label="Explore programmes">
      <div className="dash-cta-icon" aria-hidden>
        <GraduationCap className="size-6" strokeWidth={1.75} />
      </div>
      <div className="dash-cta-copy">
        <p className="dash-cta-title">Expand your skills. Advance your future.</p>
        <p className="dash-cta-lead">
          Explore advanced AI and cybersecurity programmes tailored to your learning path.
        </p>
      </div>
      <Link href="/student/enroll" className="dash-cta-button">
        Explore Programs
        <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
      </Link>
    </section>
  );
}
