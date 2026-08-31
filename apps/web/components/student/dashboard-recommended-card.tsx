import Link from "next/link";
import type { ProgramCategory } from "@prisma/client";
import { Clock3, Sparkles } from "lucide-react";
import { CourseVisualIllustration } from "@/components/marketing/course-visual-illustration";
import {
  courseCategoryLabel,
  courseVisualToneClass,
  resolveCourseVisualTheme,
} from "@/lib/programs/course-visual";
import { cn } from "@/lib/utils";

export function DashboardRecommendedCard({
  title,
  href,
  category,
  durationLabel,
  reason,
}: {
  title: string;
  href: string;
  category?: ProgramCategory | null;
  durationLabel: string;
  reason?: string;
}) {
  const theme = resolveCourseVisualTheme({ title, category });
  const tone = courseVisualToneClass(theme);

  return (
    <article className="dash-recommended-card">
      <Link href={href} className="dash-recommended-thumb">
        <span className="dash-continue-tag">{courseCategoryLabel(category)}</span>
        <CourseVisualIllustration
          track={theme}
          title={title}
          category={category}
          variant="card"
          className="dash-continue-illustration"
        />
        <div className={cn("dash-continue-gradient", tone)} />
        <p className="dash-continue-thumb-title">{title}</p>
      </Link>

      <div className="dash-recommended-body">
        <Link href={href} className="dash-continue-title">
          {title}
        </Link>
        {reason ? (
          <p className="dash-recommended-reason">
            <Sparkles className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            {reason}
          </p>
        ) : null}
        <p className="dash-recommended-duration">
          <Clock3 className="size-3.5" strokeWidth={1.75} aria-hidden />
          {durationLabel}
        </p>
      </div>
    </article>
  );
}
