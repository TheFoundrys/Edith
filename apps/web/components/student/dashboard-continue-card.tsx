import Link from "next/link";
import type { ProgramCategory } from "@prisma/client";
import { PlayCircle } from "lucide-react";
import { CourseVisualIllustration } from "@/components/marketing/course-visual-illustration";
import {
  courseCategoryLabel,
  courseVisualToneClass,
  resolveCourseVisualTheme,
} from "@/lib/programs/course-visual";
import { cn } from "@/lib/utils";

export function DashboardContinueCard({
  title,
  href,
  continueHref,
  category,
  pct,
  remainingLabel,
}: {
  title: string;
  href: string;
  continueHref: string;
  category?: ProgramCategory | null;
  pct: number;
  remainingLabel: string;
}) {
  const theme = resolveCourseVisualTheme({ title, category });
  const tone = courseVisualToneClass(theme);

  return (
    <article className="dash-continue-card">
      <Link href={href} className="dash-continue-thumb">
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

      <div className="dash-continue-body">
        <Link href={href} className="dash-continue-title">
          {title}
        </Link>
        <div className="dash-continue-progress-wrap">
          <div className="dash-continue-progress-track">
            <div className="dash-continue-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="dash-continue-pct">{pct}%</span>
        </div>
        <p className="dash-continue-meta">{remainingLabel}</p>
        <Link href={continueHref} className="dash-continue-btn">
          <PlayCircle className="size-4" strokeWidth={1.75} aria-hidden />
          Continue
        </Link>
      </div>
    </article>
  );
}
