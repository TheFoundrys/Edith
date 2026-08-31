import Link from "next/link";
import { CourseVisualIllustration } from "@/components/marketing/course-visual-illustration";
import type { HomeFeaturedCourse } from "@/lib/marketing/home-data";
import { courseVisualToneClass } from "@/lib/programs/course-visual";
import type { ProgramTrack } from "@/lib/programs/track";

const TRACK_LABELS: Record<ProgramTrack, string> = {
  ai: "Artificial Intelligence",
  cyber: "Cybersecurity",
  data: "Data Science",
  quantum: "Quantum Computing",
  blockchain: "Blockchain",
  general: "Deep Tech",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HomeFeaturedCourseCard({
  course,
}: {
  course: HomeFeaturedCourse;
}) {
  const tone = courseVisualToneClass(course.track);
  const instructorLabel = course.departmentName ?? "Edith Faculty";

  return (
    <article className="home-course-card">
      <Link href={course.href} className="home-course-card-link">
        <div className={`home-course-card-top ${tone}`}>
          <CourseVisualIllustration
            track={course.track}
            title={course.title}
            variant="card"
            className="home-course-card-illustration"
          />
          {course.badge ? (
            <span className="home-course-badge">{course.badge}</span>
          ) : null}
          <p className="home-course-track">{TRACK_LABELS[course.track]}</p>
          <h3 className="home-course-card-title">{course.title}</h3>
        </div>
        <div className="home-course-card-body">
          <p className="home-course-card-desc">
            {course.description ||
              "Explore this programme on Edith — syllabus, intakes, and enrolment details."}
          </p>
          <div className="home-course-card-meta">
            <span className="home-course-learners">
              {course.learnerCount > 0
                ? `${course.learnerCount} learner${course.learnerCount === 1 ? "" : "s"} enrolled`
                : "Open for enrolment"}
            </span>
            <span className="home-course-duration">{course.durationLabel}</span>
          </div>
          <div className="home-course-instructor">
            <span className="home-course-instructor-avatar" aria-hidden>
              {initials(instructorLabel)}
            </span>
            <span>
              <span className="home-course-instructor-name">{instructorLabel}</span>
              <span className="home-course-instructor-role">Programme faculty</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function HomeCourseShowcase({
  courses,
}: {
  courses: HomeFeaturedCourse[];
}) {
  if (courses.length === 0) return null;

  return (
    <section className="home-section" aria-labelledby="home-courses-heading">
      <div className="home-container">
        <div className="home-section-head">
          <div>
            <h2 id="home-courses-heading" className="home-section-title">
              Explore top AI &amp; cybersecurity courses
            </h2>
            <p className="home-section-lead">
              Featured programmes from the live Edith catalogue — ranked by subject
              focus and learner enrolment.
            </p>
          </div>
          <Link href="/courses" className="home-section-link">
            View all courses
          </Link>
        </div>
        <div className="home-course-grid">
          {courses.map((course) => (
            <HomeFeaturedCourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
