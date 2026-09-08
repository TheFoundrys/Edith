import type {
  CourseLevel,
  DegreeLevel,
  Intake,
  ProgramCategory,
} from "@prisma/client";
import {
  isPersonalityProfileProgram,
  PERSONALITY_PROFILE_HREF,
} from "@/lib/assessments/personality-profile";
import {
  displayProgramName,
  programCategoryLabel,
} from "@/lib/programs/categories";
import {
  catalogDurationLabel,
  catalogExperienceLabel,
  catalogMode,
} from "@/lib/programs/catalog-meta";
import { formatCurrency } from "@/lib/utils";
import {
  resolveCourseVisualTheme,
  type CourseVisualTheme,
} from "@/lib/programs/course-visual";

export type CoursePageModule = {
  id: string;
  title: string;
  summary: string | null;
  lessonCount: number;
  lessons: {
    id: string;
    title: string;
    durationMin: number | null;
  }[];
};

export type CoursePageIntake = {
  id: string;
  name: string;
  closeLabel: string;
};

export type CoursePageInstructor = {
  name: string;
  title: string;
  bio: string;
};

export type CourseLandingModel = {
  id: string;
  slug: string;
  title: string;
  categoryLabel: string;
  categoryShort: string;
  breadcrumbCategory: string;
  description: string | null;
  specialization: string | null;
  levelLabel: string | null;
  formatLabel: string;
  startsLabel: string;
  durationLabel: string;
  certificateLabel: string;
  tuitionLabel: string;
  tuitionNote: string;
  learnerCount: number;
  capacity: number | null;
  learningOutcomes: string[];
  careerOutcomes: string[];
  deliverables: string[];
  tags: string[];
  methodologyModules: CoursePageModule[];
  curriculumModules: CoursePageModule[];
  intakes: CoursePageIntake[];
  instructor: CoursePageInstructor | null;
  departmentName: string | null;
  campusName: string | null;
  category: ProgramCategory;
  hasCertificate: boolean;
  visualTheme: CourseVisualTheme;
  domainSlug: string | null;
  isAssessment: boolean;
  workspaceHref: string;
};

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: "Beginner friendly",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const DEFAULT_DELIVERABLES = [
  "Certificate of completion",
  "Resource library access",
  "Community & alumni network",
];

const DEFAULT_VALUE_PROPS = [
  "Limited seats per cohort",
  "Lifetime access to resources",
  "Certificate of completion",
  "Community & alumni access",
  "Flexible payment options",
];

const ASSESSMENT_DELIVERABLES = [
  "Aadhaar and PAN on file (hash + mask only)",
  "Resume skill keywords and recommended sitting",
  "Mandatory ₹3,500 + GST 90-question exam",
  "Percentile rank plus aptitude, quantitative and psyche scores on your profile",
  "Trainer guidance from the student graph",
];

const ASSESSMENT_VALUE_PROPS = [
  "Open to every career stage",
  "90-minute sitting",
  "₹3,500 + GST",
  "Public rank board on completion",
  "Direct enroll — no application form",
];

export function courseLandingValueProps(
  hasCertificate: boolean,
  capacity: number | null,
  isAssessment = false,
) {
  if (isAssessment) return ASSESSMENT_VALUE_PROPS;
  return DEFAULT_VALUE_PROPS.map((item) => {
    if (item.startsWith("Limited seats") && capacity != null) {
      return `Limited seats — ${capacity} per cohort`;
    }
    if (item.startsWith("Certificate") && !hasCertificate) {
      return "Credential on successful completion";
    }
    return item;
  });
}

export { DEFAULT_VALUE_PROPS };

function formatIntakeClose(intake: Intake) {
  if (!intake.applicationClose) return "Open";
  return `Closes ${intake.applicationClose.toLocaleDateString("en-IN")}`;
}

function tuitionDisplay(price: number | null, currency: string) {
  if (price == null) return { label: "Contact Admissions", note: "" };
  if (price === 0) return { label: "Free", note: "" };
  const tax = currency.toUpperCase() === "INR" ? "+ GST" : "+ Taxes";
  return {
    label: `${formatCurrency(price, currency)} ${tax}`,
    note: "Tuition fee",
  };
}

function buildCareerOutcomes(
  learningOutcomes: string[],
  eligibilitySummary: string | null,
) {
  const fromEligibility =
    eligibilitySummary
      ?.split(/[.;]/)
      .map((part) => part.trim())
      .filter(Boolean) ?? [];

  if (learningOutcomes.length >= 3) {
    return [
      ...learningOutcomes,
      "Stay ahead with future-ready teaching skills",
    ].slice(0, 4);
  }

  return fromEligibility.length > 0
    ? fromEligibility.slice(0, 4)
    : learningOutcomes;
}

export function buildCourseLandingModel(input: {
  course: {
    id: string;
    slug: string;
    title: string;
    category: ProgramCategory;
    degreeLevel: DegreeLevel;
    description: string | null;
    eligibilitySummary: string | null;
    specialization: string | null;
    level: CourseLevel | null;
    price: number | null;
    tuitionCurrency: string;
    capacity: number | null;
    tags: string[];
    learningOutcomes: string[];
    certificateTemplateId: string | null;
    duration: string | null;
    isHybridOnly: boolean;
    domainSlug: string | null;
    campus: { name: string } | null;
    department: { name: string } | null;
    intakes: Intake[];
    syllabus: {
      title: string | null;
      modules: {
        id: string;
        title: string;
        summary: string | null;
        lessons: {
          id: string;
          title: string;
          durationMin: number | null;
        }[];
      }[];
    } | null;
  };
  learnerCount: number;
}): CourseLandingModel {
  const { course, learnerCount } = input;
  const title = displayProgramName(course.title, course.category);
  const categoryLabel = programCategoryLabel(course.category);
  const tuition = tuitionDisplay(course.price, course.tuitionCurrency);
  const nextIntake = course.intakes[0];
  const modules =
    course.syllabus?.modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      summary: mod.summary,
      lessonCount: mod.lessons.length,
      lessons: mod.lessons,
    })) ?? [];

  const curriculumModules = modules.filter((mod) => mod.lessonCount > 0);
  const methodologyModules =
    curriculumModules.length > 0
      ? modules.filter((mod) => mod.lessonCount === 0)
      : modules;

  const titleTag = title.includes(":") ? title.split(":")[0]?.trim() : null;

  const isAssessment = isPersonalityProfileProgram(course);
  const hasCertificate =
    !isAssessment &&
    (course.certificateTemplateId != null ||
      course.tags.some((tag) => /cert/i.test(tag)));

  return {
    id: course.id,
    slug: course.slug,
    title,
    category: course.category,
    categoryLabel,
    categoryShort: isAssessment
      ? "Assessment"
      : (titleTag ??
        course.specialization ??
        categoryLabel.replace(/ Programs?$/i, "")),
    breadcrumbCategory: isAssessment
      ? "Assessments"
      : (titleTag ?? categoryLabel),
    description: course.description,
    specialization: course.specialization,
    levelLabel: isAssessment
      ? "All levels"
      : course.level
        ? LEVEL_LABELS[course.level]
        : null,
    formatLabel: catalogMode(course),
    startsLabel: isAssessment
      ? "Start anytime"
      : nextIntake?.startDate
        ? nextIntake.startDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Rolling admissions",
    durationLabel: catalogDurationLabel(course),
    certificateLabel: isAssessment
      ? "Profile report"
      : hasCertificate
        ? "Yes"
        : "On completion",
    tuitionLabel: tuition.label,
    tuitionNote: isAssessment ? "Assessment fee" : tuition.note,
    learnerCount,
    capacity: isAssessment ? null : course.capacity,
    learningOutcomes: course.learningOutcomes,
    careerOutcomes: isAssessment
      ? [
          "A scored map of how you reason and calculate",
          "A qualitative psyche profile you can share with admissions",
          "A shortlist of Foundrys programmes that fit how you work",
        ]
      : buildCareerOutcomes(
          course.learningOutcomes,
          course.eligibilitySummary,
        ),
    deliverables: isAssessment ? ASSESSMENT_DELIVERABLES : DEFAULT_DELIVERABLES,
    tags: course.tags,
    methodologyModules,
    curriculumModules: isAssessment ? [] : curriculumModules,
    intakes: isAssessment
      ? []
      : course.intakes.map((intake) => ({
          id: intake.id,
          name: intake.name,
          closeLabel: formatIntakeClose(intake),
        })),
    instructor: null,
    departmentName: course.department?.name ?? null,
    campusName: isAssessment ? null : (course.campus?.name ?? null),
    hasCertificate,
    domainSlug: course.domainSlug,
    visualTheme: resolveCourseVisualTheme({
      title,
      domainSlug: course.domainSlug,
      tags: course.tags,
      category: course.category,
    }),
    isAssessment,
    workspaceHref: isAssessment
      ? PERSONALITY_PROFILE_HREF
      : `/student/my-courses/${course.id}`,
  };
}

export function courseExperienceLabel(course: {
  slug: string;
  eligibilitySummary: string | null;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  campus: { name: string } | null;
}) {
  return catalogExperienceLabel(course);
}
