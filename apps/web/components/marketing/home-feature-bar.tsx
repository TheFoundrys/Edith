import {
  Award,
  GraduationCap,
  Laptop,
  Users,
} from "lucide-react";
import type { HomePageData } from "@/lib/marketing/home-data";

const FEATURES = [
  {
    key: "instructors",
    icon: GraduationCap,
    title: "Expert instructors",
    description: (highlights: HomePageData["featureHighlights"]) =>
      `${highlights.instructors}+ faculty and industry mentors across deep-tech programmes.`,
  },
  {
    key: "flexible",
    icon: Laptop,
    title: "Flexible learning",
    description: (highlights: HomePageData["featureHighlights"]) =>
      `${highlights.hybridCourses} hybrid and live-online pathways designed for working professionals.`,
  },
  {
    key: "certification",
    icon: Award,
    title: "Certification",
    description: (highlights: HomePageData["featureHighlights"]) =>
      `${highlights.certificates}+ credentials issued across AI, cybersecurity, and emerging tech.`,
  },
  {
    key: "community",
    icon: Users,
    title: "Learning community",
    description: (highlights: HomePageData["featureHighlights"]) =>
      `${highlights.activeLearners}+ learners building skills together on Edith.`,
  },
] as const;

export function HomeFeatureBar({
  highlights,
}: {
  highlights: HomePageData["featureHighlights"];
}) {
  return (
    <section className="home-feature-bar" aria-labelledby="home-features-heading">
      <div className="home-container">
        <h2 id="home-features-heading" className="sr-only">
          Platform highlights
        </h2>
        <div className="home-feature-bar-inner">
          {FEATURES.map(({ key, icon: Icon, title, description }) => (
            <article key={key} className="home-feature-item">
              <span className="home-feature-icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="home-feature-title">{title}</h3>
                <p className="home-feature-copy">{description(highlights)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
