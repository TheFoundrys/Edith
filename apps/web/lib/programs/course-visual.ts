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

const COURSE_COVERS: Record<CourseVisualTheme, string[]> = {
  ai: [
    "1677442136019-21780ecad995",
    "1485827404703-89b55fcc595e",
    "1531746790731-6c087fecd65a",
    "1620712943543-bcc4688e7485",
    "1581091226825-a6a2a5aee158",
  ],
  cyber: [
    "1550751827-4bd374c3f58b",
    "1563986768609-322da13575f3",
    "1555949963-aa79dcee981c",
    "1526374965328-7f61d4dc18c5",
    "1555949963-ff9fe0c870eb",
  ],
  data: [
    "1551288049-bebda4e38f71",
    "1460925895917-afdab827c52f",
    "1488590528505-98d2b5aba04b",
    "1543286386-713bdd548da4",
    "1454165804606-c3d57bc86b40",
  ],
  quantum: [
    "1635070041078-e363dbe005cb",
    "1518770660439-4636190af475",
    "1581092160562-40aa08e78837",
    "1581092795360-fd1ca04f0952",
    "1581091226825-a6a2a5aee158",
  ],
  blockchain: [
    "1639762681485-074b7f938ba0",
    "1621761191319-c6fb62004040",
    "1639322537228-f710d846310a",
    "1642790106117-e829e14a795f",
    "1517694712202-14dd9538aa97",
  ],
  educators: [
    "1523240795612-9a054b0db644",
    "1427504494785-3a9ca7044f45",
    "1573164713714-d95e436ab8d6",
    "1522202176988-66273c2fd55f",
    "1524995997946-a1c2e315a42f",
  ],
  general: [
    "1562774053-701939374585",
    "1523580494863-6f3031224c94",
    "1523580846011-d3a5bc25702b",
    "1498243691581-b145c3f54a5a",
    "1516321318423-f06f85e504b3",
  ],
};

function coverIndex(seed: string, length: number) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % Math.max(length, 1);
}

export function unsplashCoverUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1600&q=80`;
}

export function courseCoverSrc(theme: CourseVisualTheme, seed: string = theme) {
  const pool = COURSE_COVERS[theme];
  const photoId = pool[coverIndex(seed, pool.length)] ?? pool[0]!;
  return unsplashCoverUrl(photoId);
}

export function courseCoverForProgram(input: {
  track?: CourseVisualTheme;
  title?: string;
  domainSlug?: string | null;
  tags?: string[];
  category?: ProgramCategory | null;
}) {
  return courseCoverSrc(resolveCourseVisualTheme(input), input.title ?? "");
}
