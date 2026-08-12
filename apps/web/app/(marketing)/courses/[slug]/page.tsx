import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import {
  PROGRAM_CATEGORIES,
  displayProgramName,
  programCategoryLabel,
} from "@/lib/programs/categories";
import { formatCurrency } from "@/lib/utils";

function programFormat(category: string, hasCampus: boolean) {
  if (category === "CENTRE_OF_EXCELLENCE") return "Institutional / Hybrid";
  if (category === "FELLOW_EXECUTIVE") return "Hybrid";
  if (category === "ADVANCED_MANAGEMENT") return "On-campus and Live-online";
  if (hasCampus) return "On-campus and Live-online";
  return "Hybrid";
}

function programDuration(slug: string, degreeLevel: string, category: string) {
  if (category === "ADVANCED_MANAGEMENT") return "13 Weeks";
  if (category === "FELLOW_EXECUTIVE") return "Cohort-based";
  if (category === "CENTRE_OF_EXCELLENCE") return "Custom";
  switch (degreeLevel) {
    case "BACHELORS":
      return "3 Years";
    case "MASTERS":
      return slug.startsWith("mba-") ? "3+1 Years" : "1–2 Years";
    case "CERTIFICATE":
      return "Program-dependent";
    default:
      return "Custom Duration";
  }
}

function coursePrice(program: {
  tuitionAmount: number | null;
  applicationFee: number | null;
}) {
  if (program.tuitionAmount != null && program.tuitionAmount > 0) {
    return program.tuitionAmount;
  }
  if (program.applicationFee != null && program.applicationFee > 0) {
    return program.applicationFee;
  }
  return 0;
}

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.program.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      organization: true,
      department: true,
      campus: true,
      intakes: { where: { isActive: true }, orderBy: { startDate: "asc" } },
      syllabus: {
        where: { status: "PUBLISHED" },
        select: {
          title: true,
          description: true,
          modules: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  durationMin: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!course) notFound();

  const canEnroll = session?.user && !isStaffRole(session.user.role);
  const categoryMeta = PROGRAM_CATEGORIES.find(
    (c) => c.value === course.category,
  );
  const nextIntake = course.intakes[0];
  const price = coursePrice(course);
  const title = displayProgramName(course.name, course.category);
  const syllabusModules =
    course.syllabus?.modules.filter((m) => m.lessons.length > 0) ?? [];

  const activeEnrollment =
    session?.user?.id && canEnroll
      ? await prisma.enrollment.findFirst({
          where: {
            userId: session.user.id,
            programId: course.id,
            status: "ACTIVE",
          },
        })
      : null;

  const facts = [
    {
      label: "Format",
      value: programFormat(course.category, Boolean(course.campus)),
    },
    {
      label: "Starts",
      value: nextIntake?.startDate
        ? nextIntake.startDate.toLocaleDateString("en-IN", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "—",
    },
    {
      label: "Duration",
      value: programDuration(course.slug, course.degreeLevel, course.category),
    },
    {
      label: "Eligibility",
      value: course.eligibilitySummary?.replace(/\s+/g, " ").trim() || "—",
    },
    {
      label: "Fee",
      value:
        price === 0
          ? "Free"
          : `${formatCurrency(price, course.tuitionCurrency)} + Taxes`,
    },
  ];

  const enrollCallback = encodeURIComponent(`/enroll/${course.slug}`);

  return (
    <MarketingShell maxWidth="max-w-7xl" showArt={false}>
      <div className="courses-theme course-detail">
        <Breadcrumbs
          items={[
            { href: "/courses", label: "Courses" },
            { label: title },
          ]}
        />

        <div className="mt-[var(--grid-gap)] course-detail-layout">
          <div className="min-w-0 peak-rise">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
              {categoryMeta?.shortLabel ??
                programCategoryLabel(course.category)}
              {course.campus ? (
                <>
                  <span className="mx-1.5 text-border-strong">·</span>
                  <span className="font-medium normal-case tracking-normal">
                    {course.campus.name}
                  </span>
                </>
              ) : null}
            </p>

            <h1 className="courses-heading mt-3 font-display text-3xl sm:text-4xl lg:text-[2.65rem] leading-[1.08] break-words">
              {title}
            </h1>

            {course.summary ? (
              <p className="courses-desc mt-4 max-w-2xl text-[15px] sm:text-base leading-relaxed">
                {course.summary}
              </p>
            ) : null}

            <dl className="courses-detail course-detail-facts mt-8">
              {facts.map((row) => (
                <div key={row.label} className="course-detail-fact">
                  <dt>{row.label}</dt>
                  <dd className={row.label === "Fee" ? "font-medium text-fg" : undefined}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            {syllabusModules.length ? (
              <section className="mt-10">
                <h2 className="courses-heading font-display text-xl">
                  {course.syllabus?.title || "Course outline"}
                </h2>
                {course.syllabus?.description ? (
                  <p className="mt-2 max-w-2xl text-sm text-fg-muted leading-relaxed">
                    {course.syllabus.description}
                  </p>
                ) : null}
                <ul className="mt-5 course-detail-outline">
                  {syllabusModules.map((mod) => (
                    <li key={mod.id} className="course-detail-module">
                      <p className="text-sm font-medium text-fg">{mod.title}</p>
                      {mod.summary ? (
                        <p className="mt-1 text-sm text-fg-muted leading-relaxed">
                          {mod.summary}
                        </p>
                      ) : null}
                      <ul className="mt-3 space-y-1.5">
                        {mod.lessons.map((lesson) => (
                          <li
                            key={lesson.id}
                            className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 text-sm"
                          >
                            <span className="text-fg">{lesson.title}</span>
                            {lesson.durationMin != null ? (
                              <span className="text-xs text-fg-muted shrink-0 tabular-nums">
                                {lesson.durationMin} min
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {course.intakes.length > 0 ? (
              <section className="mt-10">
                <h2 className="courses-heading font-display text-xl">
                  Open intakes
                </h2>
                <ul className="mt-4 course-detail-intakes">
                  {course.intakes.map((intake) => (
                    <li key={intake.id}>
                      <span className="text-sm text-fg">{intake.name}</span>
                      <span className="text-xs text-fg-muted">
                        {intake.applicationClose
                          ? `Closes ${intake.applicationClose.toLocaleDateString()}`
                          : "Open"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="min-w-0 peak-rise-delay">
            <div className="course-detail-cta sticky top-[calc(3.5rem+var(--grid-gap))]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                Tuition
              </p>
              <p className="courses-heading mt-2 font-display text-2xl sm:text-3xl break-words">
                {price === 0
                  ? "Free"
                  : formatCurrency(price, course.tuitionCurrency)}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {activeEnrollment ? (
                  <Link href={`/student/my-courses/${course.id}`}>
                    <Button className="w-full">Go to my course</Button>
                  </Link>
                ) : canEnroll ? (
                  <Link href={`/enroll/${course.slug}`}>
                    <Button className="w-full">Enroll now</Button>
                  </Link>
                ) : session?.user ? (
                  <Link href="/admin">
                    <Button variant="secondary" className="w-full">
                      Staff workspace
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href={`/login?callbackUrl=${enrollCallback}`}>
                      <Button className="w-full">Sign in to enroll</Button>
                    </Link>
                    <Link
                      href={`/register?callbackUrl=${enrollCallback}`}
                      className="courses-cta text-center"
                    >
                      Create account →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MarketingShell>
  );
}
