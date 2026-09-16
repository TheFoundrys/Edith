import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { EngagementItem } from "@/lib/learning/student-engagement";

const kindLabel: Record<EngagementItem["kind"], string> = {
  assignment: "Assignment",
  quiz: "Quiz",
  "lesson-mcq": "Lesson quiz",
  "course-mcq": "Course MCQ",
};

export function EngagementQueue({
  items,
  title = "Keep engaging",
  viewAllHref = "/student/assessments",
}: {
  items: EngagementItem[];
  title?: string;
  viewAllHref?: string;
}) {
  return (
    <section className="dash-widget dash-list-widget">
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">{title}</h2>
        <Link href={viewAllHref} className="dash-widget-link">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="dash-empty">
          You&apos;re caught up — explore lessons or retake a quiz to stay sharp.
        </p>
      ) : (
        <ul className="dash-deadline-list">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link href={item.href} className="dash-deadline-item">
                <span className="dash-deadline-icon" aria-hidden>
                  <Sparkles className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="dash-deadline-title">{item.title}</span>
                  <span className="dash-deadline-subtitle">
                    {kindLabel[item.kind]} · {item.subtitle}
                  </span>
                </span>
                <span className="dash-deadline-when">
                  <span className="dash-deadline-badge">{item.label}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
