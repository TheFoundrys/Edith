import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/session";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { CourseLandingPage } from "@/components/marketing/course-landing-page";
import { prisma } from "@/lib/db";
import { getStudentCourseEnrollmentState } from "@/lib/enrollment/student-state";
import { buildCourseLandingModel } from "@/lib/marketing/course-page-data";
import { getDefaultOrganizationId } from "@/lib/organizations/default";
import {
  PERSONALITY_PROFILE_PUBLIC_HREF,
  PERSONALITY_PROFILE_SLUG,
} from "@/lib/assessments/personality-profile";

export default async function PublicCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === PERSONALITY_PROFILE_SLUG) {
    redirect(PERSONALITY_PROFILE_PUBLIC_HREF);
  }
  const session = await auth();
  const organizationId = await getDefaultOrganizationId();

  const course = await prisma.program.findFirst({
    where: { organizationId, slug, status: "PUBLISHED" },
    include: {
      campus: true,
      department: true,
      intakes: { where: { isActive: true }, orderBy: { startDate: "asc" } },
      _count: { select: { enrollments: true } },
      syllabus: {
        where: { status: "PUBLISHED" },
        select: {
          title: true,
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
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

  const isStaff = Boolean(session?.user && isStaffRole(session.user.role));
  const isStudent = Boolean(session?.user && !isStaff);
  const enrollCallback = encodeURIComponent(`/enroll/${course.slug}`);

  const enrollmentState =
    isStudent && session?.user?.id
      ? await getStudentCourseEnrollmentState(session.user.id, {
          id: course.id,
          requiresCrmCallback: course.requiresCrmCallback,
        })
      : { kind: "none" as const };

  const enrollState = isStaff
    ? ("staff" as const)
    : enrollmentState.kind === "active"
      ? ("active" as const)
      : enrollmentState.kind === "pending_crm"
        ? ("pending_crm" as const)
        : enrollmentState.kind === "pending_payment"
          ? ("pending_payment" as const)
          : isStudent
            ? ("open" as const)
            : ("guest" as const);

  const landing = buildCourseLandingModel({
    course,
    learnerCount: course._count.enrollments,
  });

  return (
    <MarketingShell maxWidth="max-w-7xl" showArt={false}>
      <div className="courses-theme">
        <CourseLandingPage
          course={landing}
          syllabusTitle={course.syllabus?.title ?? null}
          enroll={{
            state: enrollState,
            enrollCallback,
            programId: course.id,
          }}
        />
      </div>
    </MarketingShell>
  );
}
