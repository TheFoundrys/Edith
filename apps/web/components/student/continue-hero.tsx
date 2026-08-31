"use client";

import Link from "next/link";
import { Award, BookOpenCheck, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardProgressRow } from "@/components/student/dashboard-home";
import {
  courseBannerClass,
  courseCategoryLabel,
} from "@/lib/programs/course-visual";
import { cn } from "@/lib/utils";

function ContinueHeroMotif() {
  return (
    <svg
      className="lms-continue-motif"
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g opacity="0.28" stroke="currentColor" fill="none" strokeWidth="0.65">
        <path d="M 24 48 L 120 28 L 216 48 C 216 120 192 188 120 216 C 48 188 24 120 24 48 Z" />
        <path d="M 40 58 L 120 42 L 200 58 C 200 124 178 182 120 204 C 62 182 40 124 40 58 Z" />
      </g>
      <g opacity="0.42" stroke="currentColor" fill="none" strokeWidth="0.55">
        <path d="M 58 92 C 52 78 46 68 38 60" />
        <path d="M 68 92 C 62 78 56 68 48 60" />
        <path d="M 78 92 C 72 78 66 68 58 60" />
        <path d="M 88 92 C 82 78 76 68 68 60" />
        <path d="M 98 92 C 92 78 86 68 78 60" />
      </g>
      <path
        d="M 112 108 C 104 96 108 84 120 84 C 132 84 136 96 128 108 L 120 118 Z"
        fill="currentColor"
        opacity="0.14"
      />
      <path
        d="M 152 138 L 188 134 C 192 134 194 137 192 141 L 158 141 C 154 141 152 140 152 138 Z"
        fill="currentColor"
        opacity="0.12"
      />
      <ellipse
        cx="168"
        cy="158"
        rx="16"
        ry="20"
        stroke="currentColor"
        strokeWidth="0.7"
        fill="none"
        opacity="0.32"
      />
      <path
        d="M 152 158 C 152 146 158 138 168 138 C 178 138 184 146 184 158"
        stroke="currentColor"
        strokeWidth="0.55"
        fill="none"
        opacity="0.24"
      />
      <circle cx="120" cy="120" r="54" stroke="currentColor" strokeWidth="0.4" opacity="0.18" />
      <circle cx="120" cy="120" r="38" stroke="currentColor" strokeWidth="0.35" opacity="0.12" />
    </svg>
  );
}

export function ContinueHero({
  row,
  certificateHref,
}: {
  row: DashboardProgressRow;
  certificateHref?: string | null;
}) {
  const isComplete =
    row.total > 0 && (row.pct >= 100 || row.done >= row.total);
  const remaining = Math.max(row.total - row.done, 0);
  const reviewHref = `/student/my-courses/${row.programId}`;
  const outlineHref = `/student/learning/${row.programId}`;

  return (
    <section
      className={cn(
        "lms-continue-hero group/hero bg-gradient-to-br",
        courseBannerClass(row.category),
      )}
    >
      <div className="lms-continue-hero-grid" aria-hidden />
      <ContinueHeroMotif />

      <div className="lms-continue-hero-body">
        <div className="lms-continue-hero-copy">
          <p className="lms-continue-eyebrow">
            {isComplete ? "Course complete" : "Continue learning"}
          </p>
          <span className="lms-continue-category">
            {courseCategoryLabel(row.category)}
          </span>
          <h2 className="lms-continue-title">{row.title}</h2>
          <p className="lms-continue-meta">
            {isComplete
              ? `${row.done} of ${row.total} · Complete`
              : `Lesson ${Math.min(row.done + 1, row.total)} of ${row.total}${
                  remaining > 0 ? ` · ${remaining} remaining` : ""
                }`}
          </p>
          <div className="progress-track lms-continue-track mt-4 h-2 max-w-md">
            <div className="progress-fill" style={{ width: `${row.pct}%` }} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {isComplete ? (
              <Link href={reviewHref}>
                <Button size="sm" className="lms-continue-cta">
                  <BookOpenCheck className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Review course
                </Button>
              </Link>
            ) : (
              <Link href={row.href}>
                <Button size="sm" className="lms-continue-cta">
                  <PlayCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  Resume lesson
                </Button>
              </Link>
            )}
            {isComplete && certificateHref ? (
              <Link href={certificateHref}>
                <Button variant="ghost" size="sm" className="lms-continue-cta-secondary">
                  <Award className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  View certificate
                </Button>
              </Link>
            ) : (
              <Link href={outlineHref}>
                <Button variant="ghost" size="sm" className="lms-continue-cta-secondary">
                  Course outline
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="lms-continue-editorial" aria-hidden>
          <p className="lms-continue-pct">
            <span className="lms-continue-pct-value">{row.pct}</span>
            <span className="lms-continue-pct-suffix">%</span>
          </p>
          <div className="lms-continue-pct-rule" />
          <p className="lms-continue-pct-caption">programme complete</p>
        </div>
      </div>
    </section>
  );
}
