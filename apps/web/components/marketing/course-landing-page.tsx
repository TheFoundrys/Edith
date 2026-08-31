import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import {
  CourseVisualIllustration,
} from "@/components/marketing/course-visual-illustration";
import { courseVisualToneClass } from "@/lib/programs/course-visual";
import { CourseLandingCurriculum } from "@/components/marketing/course-landing-curriculum";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import {
  courseLandingValueProps,
  type CourseLandingModel,
} from "@/lib/marketing/course-page-data";
import { cn } from "@/lib/utils";

const LEARN_ICONS = [Sparkles, Bot, BookOpen, GraduationCap] as const;
const WAY_ICONS = [Wrench, Bot, Users] as const;

type CourseLandingEnrollState =
  | "active"
  | "pending_crm"
  | "pending_payment"
  | "open"
  | "guest"
  | "staff";

type CourseLandingPageProps = {
  course: CourseLandingModel;
  syllabusTitle: string | null;
  enroll: {
    state: CourseLandingEnrollState;
    enrollCallback: string;
    programId: string;
  };
};

export function CourseLandingPage({
  course,
  syllabusTitle,
  enroll,
}: CourseLandingPageProps) {
  const valueProps = courseLandingValueProps(
    course.hasCertificate,
    course.capacity,
    course.isAssessment,
  );
  const visualTone = courseVisualToneClass(course.visualTheme);

  return (
    <div className="course-landing">
      <Breadcrumbs
        items={
          course.isAssessment
            ? [
                { href: "/", label: "Home" },
                { href: "/personality-profile", label: "Personality Profile" },
              ]
            : [
                { href: "/courses", label: "Courses" },
                { href: "/courses", label: course.breadcrumbCategory },
                { label: course.title },
              ]
        }
      />

      <div className="course-landing-layout">
        <div className="course-landing-main">
          <section className="course-landing-hero">
            <div className="course-landing-hero-copy">
              <span className="course-landing-tag">
                {course.categoryShort.toUpperCase()}
              </span>
              <h1 className="course-landing-title">{course.title}</h1>
              {course.description ? (
                <p className="course-landing-lead">{course.description}</p>
              ) : null}

              <div className="course-landing-stats">
                {course.learnerCount > 0 ? (
                  <span>
                    <Users className="size-4" strokeWidth={1.75} aria-hidden />
                    {course.learnerCount.toLocaleString("en-IN")}+ learners
                  </span>
                ) : null}
                {course.levelLabel ? (
                  <span>
                    <BarChart3 className="size-4" strokeWidth={1.75} aria-hidden />
                    {course.levelLabel}
                  </span>
                ) : null}
                {course.hasCertificate ? (
                  <span>
                    <Award className="size-4" strokeWidth={1.75} aria-hidden />
                    Certificate included
                  </span>
                ) : null}
              </div>

              <dl className="course-landing-quickfacts">
                <div>
                  <dt>Format</dt>
                  <dd>{course.formatLabel}</dd>
                </div>
                <div>
                  <dt>Starts</dt>
                  <dd>{course.startsLabel}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{course.durationLabel}</dd>
                </div>
                <div>
                  <dt>Certificate</dt>
                  <dd>{course.certificateLabel}</dd>
                </div>
              </dl>
            </div>

            <div className={cn("course-landing-hero-art", visualTone)}>
              <CourseVisualIllustration
                track={course.visualTheme}
                title={course.title}
                domainSlug={course.domainSlug}
                tags={course.tags}
                category={course.category}
                variant="hero"
                className="course-landing-hero-illustration"
              />
            </div>
          </section>

          {course.learningOutcomes.length > 0 ? (
            <section className="course-landing-section">
              <h2 className="course-landing-section-title">What you&apos;ll learn</h2>
              <div className="course-landing-learn-grid">
                {course.learningOutcomes.map((outcome, index) => {
                  const Icon = LEARN_ICONS[index % LEARN_ICONS.length];
                  return (
                    <article key={outcome} className="course-landing-learn-card">
                      <span className="course-landing-learn-icon" aria-hidden>
                        <Icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <p>{outcome}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {course.methodologyModules.length > 0 ? (
            <section className="course-landing-section">
              <h2 className="course-landing-section-title">The Edith Way</h2>
              <div className="course-landing-way-grid">
                {course.methodologyModules.map((mod, index) => {
                  const Icon = WAY_ICONS[index % WAY_ICONS.length];
                  return (
                    <article key={mod.id} className="course-landing-way-card">
                      <span className="course-landing-way-icon" aria-hidden>
                        <Icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <h3>{mod.title}</h3>
                      {mod.summary ? <p>{mod.summary}</p> : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {course.curriculumModules.length > 0 ? (
            <CourseLandingCurriculum
              modules={course.curriculumModules}
              syllabusTitle={syllabusTitle}
            />
          ) : null}

          <section className="course-landing-section course-landing-split">
            <div className="course-landing-panel">
              <h2 className="course-landing-section-title">What you&apos;ll get</h2>
              <ul className="course-landing-checklist">
                {course.deliverables.map((item) => (
                  <li key={item}>
                    <CheckCircle2 className="size-4" strokeWidth={1.75} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="course-landing-cert-art" aria-hidden>
                <Award className="size-10" strokeWidth={1.5} />
              </div>
            </div>

            <div className="course-landing-panel">
              <h2 className="course-landing-section-title">Career outcomes</h2>
              <ul className="course-landing-checklist">
                {course.careerOutcomes.map((item) => (
                  <li key={item}>
                    <CheckCircle2 className="size-4" strokeWidth={1.75} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="course-landing-sidebar">
          <div className="course-landing-pricing-card">
            <p className="course-landing-pricing-label">
              {course.isAssessment ? "Assessment fee" : "Tuition fee"}
            </p>
            <p className="course-landing-pricing-value">{course.tuitionLabel}</p>

            <div className="course-landing-pricing-actions">
              {enroll.state === "active" ? (
                <Link href={course.workspaceHref}>
                  <Button className="w-full">
                    {course.isAssessment ? "Open assessment" : "Go to my course"}
                  </Button>
                </Link>
              ) : enroll.state === "pending_crm" ? (
                <Link href={`/student/my-courses/${enroll.programId}?pending=crm`}>
                  <Button className="w-full">View enrollment status</Button>
                </Link>
              ) : enroll.state === "pending_payment" ? (
                <Link href={`/checkout?course=${encodeURIComponent(course.slug)}`}>
                  <Button className="w-full">Complete payment</Button>
                </Link>
              ) : enroll.state === "open" ? (
                <Link href={`/enroll/${course.slug}`}>
                  <Button className="w-full">
                    {course.isAssessment ? "Take the test" : "Enroll now"}
                  </Button>
                </Link>
              ) : enroll.state === "staff" ? (
                <Link href="/admin">
                  <Button variant="secondary" className="w-full">
                    Staff workspace
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href={`/login?callbackUrl=${enroll.enrollCallback}`}>
                    <Button className="w-full">Sign in to enroll</Button>
                  </Link>
                  <Link href={`/register?callbackUrl=${enroll.enrollCallback}`}>
                    <Button variant="secondary" className="w-full">
                      Create an account
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <ul className="course-landing-pricing-list">
              {valueProps.map((item) => (
                <li key={item}>
                  <CheckCircle2 className="size-4" strokeWidth={1.75} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="course-landing-note-card">
            <Shield className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <p>
              {course.isAssessment
                ? "Start anytime. One price for every career stage — ₹3,500 + GST."
                : course.capacity != null
                  ? `Secure your seat. Only ${course.capacity} seats per cohort.`
                  : "Secure your seat. Seats are limited for each intake."}
            </p>
          </div>

          {course.intakes.length > 0 ? (
            <div className="course-landing-side-card">
              <h3>Open intakes</h3>
              <ul>
                {course.intakes.slice(0, 3).map((intake) => (
                  <li key={intake.id}>
                    <span>{intake.name}</span>
                    <span>{intake.closeLabel}</span>
                  </li>
                ))}
              </ul>
              <Link href={`/enroll/${course.slug}`} className="course-landing-side-link">
                View all intakes
                <ArrowRight className="size-3.5" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
          ) : null}

          {course.instructor ? (
            <div className="course-landing-side-card">
              <h3>Instructor</h3>
              <div className="course-landing-instructor">
                <span className="course-landing-instructor-avatar" aria-hidden>
                  {course.instructor.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </span>
                <div>
                  <p className="course-landing-instructor-name">{course.instructor.name}</p>
                  <p className="course-landing-instructor-title">{course.instructor.title}</p>
                </div>
              </div>
              <p className="course-landing-instructor-bio">{course.instructor.bio}</p>
            </div>
          ) : null}

          {course.campusName ? (
            <div className="course-landing-side-meta">
              <Clock3 className="size-4" strokeWidth={1.75} aria-hidden />
              <span>{course.campusName}</span>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="course-landing-cta-band">
        <GraduationCap className="course-landing-cta-icon" strokeWidth={1.75} aria-hidden />
        <div className="course-landing-cta-copy">
          <h2>
            {course.isAssessment
              ? "Ready to map how you think?"
              : "Ready to start learning on Edith?"}
          </h2>
          <p>
            {course.isAssessment
              ? "Ninety minutes. Aptitude, quantitative and psyche analysis. One profile, used to match you to a Foundrys path."
              : `Join educators and professionals building the future of learning with ${course.title}.`}
          </p>
        </div>
        {enroll.state === "active" ? (
          <Link href={course.workspaceHref} className="course-landing-cta-btn">
            {course.isAssessment ? "Open assessment" : "Continue learning"}
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : enroll.state === "pending_crm" ? (
          <Link
            href={`/student/my-courses/${enroll.programId}?pending=crm`}
            className="course-landing-cta-btn"
          >
            View enrollment status
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : enroll.state === "pending_payment" ? (
          <Link
            href={`/checkout?course=${encodeURIComponent(course.slug)}`}
            className="course-landing-cta-btn"
          >
            Complete payment
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : enroll.state === "open" ? (
          <Link href={`/enroll/${course.slug}`} className="course-landing-cta-btn">
            {course.isAssessment ? "Take the test" : "Enroll now"}
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        ) : (
          <Link
            href={`/login?callbackUrl=${enroll.enrollCallback}`}
            className="course-landing-cta-btn"
          >
            Sign in to enroll
            <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </section>
    </div>
  );
}
