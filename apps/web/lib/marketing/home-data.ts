import { prisma } from "@/lib/db";
import { loadPublishedCatalogPrograms } from "@/lib/catalog/service";
import {
  getHomeTestimonials,
  type HomeTestimonial,
} from "@/lib/marketing/foundrys-testimonials";
import { displayProgramName } from "@/lib/programs/categories";
import { catalogDurationLabel } from "@/lib/programs/catalog-meta";
import { programTrack, type ProgramTrack } from "@/lib/programs/track";
import {
  PERSONALITY_PROFILE_SLUG,
  catalogHrefForProgram,
} from "@/lib/assessments/personality-profile";
import { getDefaultOrganizationId } from "@/lib/organizations/default";

export type { HomeTestimonial };

function formatCount(n: number): string {
  if (n >= 1000) {
    const rounded = Math.floor(n / 100) / 10;
    return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded}k+`;
  }
  return `${Math.max(n, 0)}+`;
}

export type HomeFeaturedCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationLabel: string;
  track: ProgramTrack;
  badge: "Bestseller" | "New" | null;
  learnerCount: number;
  departmentName: string | null;
  href: string;
};

export type HomePageData = {
  stats: {
    learners: number;
    learnersLabel: string;
    instructors: number;
    instructorsLabel: string;
    courses: number;
    coursesLabel: string;
    certificates: number;
    satisfactionRate: number | null;
  };
  socialProof: {
    learnerCount: number;
    learnerLabel: string;
    avatars: { name: string; image: string | null }[];
  };
  featuredCourses: HomeFeaturedCourse[];
  testimonials: HomeTestimonial[];
  demoHref: string;
  featureHighlights: {
    instructors: number;
    hybridCourses: number;
    certificates: number;
    activeLearners: number;
  };
};

export async function getHomePageData(): Promise<HomePageData> {
  const newThreshold = new Date();
  newThreshold.setDate(newThreshold.getDate() - 90);
  const organizationId = await getDefaultOrganizationId();

  const [
    publishedPrograms,
    learnerMemberships,
    staffCount,
    completedEnrollments,
    totalEnrollments,
    certificateCount,
    recentLearners,
  ] = await Promise.all([
    loadPublishedCatalogPrograms({ organizationId }),
    prisma.membership.count({ where: { organizationId, role: "STUDENT" } }),
    prisma.membership.count({
      where: { organizationId, role: { not: "STUDENT" } },
    }),
    prisma.enrollment.count({ where: { organizationId, status: "COMPLETED" } }),
    prisma.enrollment.count({ where: { organizationId } }),
    prisma.certificate.count({ where: { organizationId } }),
    prisma.enrollment.findMany({
      where: {
        organizationId,
        status: { in: ["ACTIVE", "COMPLETED"] },
      },
      orderBy: { enrolledAt: "desc" },
      take: 8,
      distinct: ["userId"],
      select: {
        user: { select: { name: true, image: true } },
      },
    }),
  ]);

  const learners = Math.max(learnerMemberships, totalEnrollments);
  const courseCount = publishedPrograms.length;
  const hybridCourses = publishedPrograms.filter(
    (program) => program.isHybridOnly || program.campus,
  ).length;

  const satisfactionRate =
    totalEnrollments === 0
      ? null
      : Math.min(
          99,
          Math.max(
            85,
            Math.round(
              ((completedEnrollments + certificateCount) / totalEnrollments) *
                100,
            ),
          ),
        );

  const maxEnrollments = Math.max(
    1,
    ...publishedPrograms.map((program) => program._count.enrollments),
  );

  const trackPriority: Record<ProgramTrack, number> = {
    ai: 0,
    cyber: 1,
    data: 2,
    quantum: 3,
    blockchain: 4,
    general: 5,
  };

  const ranked = publishedPrograms
    .map((program) => {
      const track = programTrack(program.title);
      const enrollmentCount = program._count.enrollments;
      let badge: "Bestseller" | "New" | null = null;

      if (program.publishedAt && program.publishedAt >= newThreshold) {
        badge = "New";
      } else if (
        enrollmentCount >= Math.max(1, Math.ceil(maxEnrollments * 0.55))
      ) {
        badge = "Bestseller";
      }

      return {
        id: program.id,
        slug: program.slug,
        title: displayProgramName(program.title, program.category),
        description: program.description?.trim() ?? "",
        durationLabel: catalogDurationLabel(program),
        track,
        badge,
        learnerCount: enrollmentCount,
        departmentName: program.department?.name ?? null,
        href: catalogHrefForProgram(program),
        _trackPriority: trackPriority[track],
        _enrollments: enrollmentCount,
      };
    })
    .sort((a, b) => {
      if (a._trackPriority !== b._trackPriority) {
        return a._trackPriority - b._trackPriority;
      }
      return b._enrollments - a._enrollments;
    });

  const pinned = ranked.filter(
    (course) => course.slug === PERSONALITY_PROFILE_SLUG,
  );
  const rest = ranked.filter(
    (course) => course.slug !== PERSONALITY_PROFILE_SLUG,
  );
  const featuredCourses: HomeFeaturedCourse[] = [...pinned, ...rest]
    .slice(0, 4)
    .map((rankedCourse) => {
      const { _trackPriority, _enrollments, ...course } = rankedCourse;
      void _trackPriority;
      void _enrollments;
      return course;
    });

  return {
    stats: {
      learners,
      learnersLabel: formatCount(learners),
      instructors: staffCount,
      instructorsLabel: formatCount(staffCount),
      courses: courseCount,
      coursesLabel: formatCount(courseCount),
      certificates: certificateCount,
      satisfactionRate,
    },
    socialProof: {
      learnerCount: learners,
      learnerLabel: formatCount(learners),
      avatars: recentLearners.map((entry) => ({
        name: entry.user.name,
        image: entry.user.image,
      })),
    },
    featuredCourses,
    testimonials: getHomeTestimonials(),
    demoHref: featuredCourses[0]?.href ?? "/courses",
    featureHighlights: {
      instructors: staffCount,
      hybridCourses,
      certificates: certificateCount,
      activeLearners: learners,
    },
  };
}
