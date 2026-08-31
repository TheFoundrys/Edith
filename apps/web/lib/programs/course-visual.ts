import type { ProgramCategory } from "@prisma/client";
import { inferProgramTrack, type ProgramTrack } from "@/lib/programs/track";

export type CourseVisualTheme = ProgramTrack | "educators";

/** Decorative course banner tones — uses existing brand palette only. */
const CATEGORY_TONE: Record<ProgramCategory, string> = {
  UNDERGRADUATE_DEGREE: "from-brand/90 to-brand/50",
  YOUNG_POST_GRADUATE: "from-brand/80 to-[color-mix(in_srgb,var(--brand)_45%,#667085)]",
  POST_GRADUATE: "from-[color-mix(in_srgb,var(--brand)_85%,#111827)] to-brand/55",
  FELLOW_EXECUTIVE: "from-brand/75 to-brand-light",
  ADVANCED_MANAGEMENT: "from-brand/70 to-[color-mix(in_srgb,var(--brand)_35%,#eef2ff)]",
  FACULTY_DEVELOPMENT: "from-brand/65 to-brand-light",
  CERTIFICATION: "from-brand/80 to-brand/40",
  CENTRE_OF_EXCELLENCE: "from-brand to-[color-mix(in_srgb,var(--brand)_60%,#111827)]",
};

const CATEGORY_LABEL: Record<ProgramCategory, string> = {
  UNDERGRADUATE_DEGREE: "Undergraduate",
  YOUNG_POST_GRADUATE: "Young PG",
  POST_GRADUATE: "Postgraduate",
  FELLOW_EXECUTIVE: "Executive",
  ADVANCED_MANAGEMENT: "Management",
  FACULTY_DEVELOPMENT: "Faculty",
  CERTIFICATION: "Certification",
  CENTRE_OF_EXCELLENCE: "Centre of Excellence",
};

export function courseBannerClass(category?: ProgramCategory | null) {
  if (category && CATEGORY_TONE[category]) {
    return CATEGORY_TONE[category];
  }
  return "from-brand/85 to-brand/45";
}

export function courseCategoryLabel(category?: ProgramCategory | null) {
  if (category && CATEGORY_LABEL[category]) {
    return CATEGORY_LABEL[category];
  }
  return "Programme";
}

export function resolveCourseVisualTheme(input: {
  track?: CourseVisualTheme;
  title?: string;
  domainSlug?: string | null;
  tags?: string[];
  category?: ProgramCategory | null;
}): CourseVisualTheme {
  if (input.track) return input.track;
  if (
    input.category === "FACULTY_DEVELOPMENT" ||
    (input.domainSlug ?? "").includes("educator")
  ) {
    return "educators";
  }
  return inferProgramTrack({
    title: input.title ?? "",
    domainSlug: input.domainSlug,
    tags: input.tags,
  });
}

export function courseVisualToneClass(theme: CourseVisualTheme): string {
  switch (theme) {
    case "educators":
    case "ai":
      return "home-course-tone-ai";
    case "cyber":
      return "home-course-tone-cyber";
    case "data":
      return "home-course-tone-data";
    case "blockchain":
      return "home-course-tone-chain";
    case "quantum":
      return "home-course-tone-quantum";
    default:
      return "home-course-tone-general";
  }
}
