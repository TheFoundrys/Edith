import Link from "next/link";
import type { ProgramCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { CourseVisualIllustration } from "@/components/marketing/course-visual-illustration";
import {
  courseCategoryLabel,
  courseVisualToneClass,
  resolveCourseVisualTheme,
} from "@/lib/programs/course-visual";
import { cn } from "@/lib/utils";

export function LmsCourseCard({
  title,
  href,
  continueHref,
  category,
  meta,
  done,
  total,
  pct,
  actionLabel = "Continue",
  compact = false,
  featured = false,
}: {
  title: string;
  href: string;
  continueHref?: string;
  category?: ProgramCategory | null;
  meta?: string;
  done: number;
  total: number;
  pct: number;
  actionLabel?: string;
  compact?: boolean;
  featured?: boolean;
}) {
  const theme = resolveCourseVisualTheme({ title, category });
  const tone = courseVisualToneClass(theme);
  const categoryLabel = courseCategoryLabel(category);

  const thumb = (
    <div
      className={cn(
        "lms-course-thumb text-accent-fg",
        tone,
        featured && "lms-course-thumb-featured",
      )}
    >
      <CourseVisualIllustration
        track={theme}
        title={title}
        category={category}
        variant="card"
        className="lms-course-thumb-illustration"
      />
      <div className="lms-course-thumb-top">
        <span className="lms-course-category">{categoryLabel}</span>
        <span className="lms-course-thumb-pct">{pct}%</span>
      </div>
      <p className={cn("lms-course-thumb-label", featured && "lms-course-thumb-label-featured")}>
        {title}
      </p>
      <div
        className="lms-course-thumb-progress"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
    </div>
  );

  const body = (
    <>
      <Link
        href={href}
        className={cn(
          "font-medium text-fg hover:text-brand line-clamp-2",
          featured && "text-lg line-clamp-none",
        )}
      >
        {title}
      </Link>
      <p className="mt-1 text-xs text-fg-muted">
        {meta ?? `${done} of ${total} lessons complete`}
      </p>
      <div className="progress-track mt-3 h-1.5">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {continueHref ? (
        <div className={cn("mt-4", featured && "mt-5")}>
          <Link href={continueHref}>
            <Button size="sm" className={featured ? "" : "w-full sm:w-auto"}>
              {pct === 100 ? "Review" : actionLabel}
            </Button>
          </Link>
        </div>
      ) : null}
    </>
  );

  if (featured) {
    return (
      <article className="lms-course-card lms-course-card-featured group">
        <div className="flex min-h-[11rem] flex-col sm:flex-row">
          <Link href={href} className="block overflow-hidden sm:w-[42%] sm:shrink-0">
            {thumb}
          </Link>
          <div className="flex flex-1 flex-col justify-center p-5 sm:p-6">{body}</div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("lms-course-card group", compact && "lms-course-card-compact")}>
      <Link href={href} className="block overflow-hidden rounded-t-[var(--radius)]">
        {thumb}
      </Link>
      <div className="flex flex-1 flex-col p-4">{body}</div>
    </article>
  );
}
