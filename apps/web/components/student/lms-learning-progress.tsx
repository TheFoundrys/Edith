import Link from "next/link";
import type { ProgramCategory } from "@prisma/client";
import { courseBannerClass, courseCategoryLabel } from "@/lib/programs/course-visual";
import { cn } from "@/lib/utils";

export type LearningProgressRow = {
  id: string;
  title: string;
  href: string;
  programId: string;
  category?: ProgramCategory | null;
  done: number;
  total: number;
  pct: number;
};

const MILESTONES = [25, 50, 75, 100];

export function LmsLearningProgress({ rows }: { rows: LearningProgressRow[] }) {
  if (rows.length === 0) return null;

  return (
    <section className="lms-progress-panel">
      <div className="lms-progress-panel-head">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-fg">
            Learning progress
          </h2>
          <p className="mt-0.5 text-xs text-fg-muted">
            Milestones across your enrolled programmes
          </p>
        </div>
        <Link href="/student/progress" className="link-quiet text-xs">
          Full report
        </Link>
      </div>
      <ul className="lms-progress-list">
        {rows.map((row) => (
          <li key={row.id} className="lms-progress-row">
            <div className="lms-progress-row-head">
              <Link href={`/student/my-courses/${row.programId}`} className="lms-progress-title">
                {row.title}
              </Link>
              <span className="lms-progress-category">
                {courseCategoryLabel(row.category)}
              </span>
            </div>
            <div className="lms-progress-track-wrap">
              <div
                className={cn(
                  "lms-progress-track-fill bg-gradient-to-r",
                  courseBannerClass(row.category),
                )}
                style={{ width: `${row.pct}%` }}
              />
              <div className="lms-progress-milestones">
                {MILESTONES.map((mark) => (
                  <span
                    key={mark}
                    className={cn(
                      "lms-progress-milestone",
                      row.pct >= mark && "lms-progress-milestone-reached",
                    )}
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="lms-progress-meta">
              <span>
                {row.done} of {row.total} lessons
              </span>
              <Link href={row.href} className="link-quiet text-xs font-medium">
                {row.pct === 100 ? "Review" : "Continue"} →
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
