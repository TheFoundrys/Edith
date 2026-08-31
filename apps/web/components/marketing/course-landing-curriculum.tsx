"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { CoursePageModule } from "@/lib/marketing/course-page-data";

export function CourseLandingCurriculum({
  modules,
  syllabusTitle,
}: {
  modules: CoursePageModule[];
  syllabusTitle?: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  if (modules.length === 0) return null;

  return (
    <section className="course-landing-section">
      <div className="course-landing-section-head">
        <h2 className="course-landing-section-title">
          {syllabusTitle?.toLowerCase().includes("curriculum")
            ? syllabusTitle
            : "Course curriculum"}
        </h2>
      </div>

      <div className="course-landing-curriculum">
        {modules.map((mod, index) => {
          const open = openId === mod.id;
          return (
            <article key={mod.id} className="course-landing-curriculum-item">
              <button
                type="button"
                className="course-landing-curriculum-trigger"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : mod.id)}
              >
                <span className="course-landing-curriculum-index">{index + 1}</span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="course-landing-curriculum-title">{mod.title}</span>
                  <span className="course-landing-curriculum-meta">
                    {mod.lessonCount > 0
                      ? `${mod.lessonCount} lesson${mod.lessonCount === 1 ? "" : "s"}`
                      : "Overview module"}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-fg-muted transition-transform",
                    open && "rotate-180",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </button>

              {open ? (
                <div className="course-landing-curriculum-panel">
                  {mod.summary ? (
                    <p className="course-landing-curriculum-summary">{mod.summary}</p>
                  ) : null}
                  {mod.lessons.length > 0 ? (
                    <ul className="course-landing-curriculum-lessons">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <span>{lesson.title}</span>
                          {lesson.durationMin != null ? (
                            <span>{lesson.durationMin} min</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
