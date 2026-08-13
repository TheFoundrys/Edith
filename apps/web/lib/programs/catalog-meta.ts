import type { DegreeLevel, ProgramCategory } from "@prisma/client";

export type CatalogMetaProgram = {
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  eligibilitySummary: string | null;
  campus: { name: string } | null;
  /** Authored duration from the catalogue, e.g. "12 Months". Preferred when set. */
  duration?: string | null;
  isHybridOnly?: boolean | null;
};

export function catalogMode(program: CatalogMetaProgram): string {
  if (program.category === "CENTRE_OF_EXCELLENCE") return "Institutional / Hybrid";
  if (program.isHybridOnly) return "Hybrid (In-Person & Virtual)";
  if (program.category === "FELLOW_EXECUTIVE") return "Hybrid";
  if (program.category === "ADVANCED_MANAGEMENT") {
    return "On-campus and Live-online";
  }
  if (program.campus) return "On-campus and Live-online";
  return "Hybrid";
}

export function catalogDurationLabel(program: CatalogMetaProgram): string {
  const authored = program.duration?.replace(/\s+/g, " ").trim();
  if (authored) return authored;
  if (program.category === "ADVANCED_MANAGEMENT") return "13 Weeks";
  if (program.category === "FELLOW_EXECUTIVE") return "Cohort-based";
  if (program.category === "CENTRE_OF_EXCELLENCE") return "Custom";
  switch (program.degreeLevel) {
    case "BACHELORS":
      return "3 Years";
    case "MASTERS":
      return program.slug.startsWith("mba-") ? "3+1 Years" : "1–2 Years";
    case "CERTIFICATE":
      return "Program-dependent";
    default:
      return "Custom";
  }
}

/**
 * Buckets a duration label into a stable filter key. Keys are coarser than
 * labels so that "6 Weeks" and "8 Weeks" share one filter option.
 */
export function catalogDurationKey(program: CatalogMetaProgram): string {
  const label = catalogDurationLabel(program).toLowerCase();

  if (/\bdays?\b/.test(label)) return "days";
  if (/cohort/.test(label)) return "cohort";
  if (/custom/.test(label)) return "custom";
  if (/program-dependent/.test(label)) return "program";
  if (/3\s*\+\s*1|\(3\+1\)/.test(label)) return "3p1y";

  const weeks = label.match(/(\d+)\s*weeks?/);
  if (weeks) return Number(weeks[1]) <= 6 ? "upto6w" : "6to13w";

  const months = label.match(/(\d+)\s*months?/);
  if (months) return Number(months[1]) <= 6 ? "upto6m" : "12m";

  const years = label.match(/(\d+)\s*years?/);
  if (years) {
    const n = Number(years[1]);
    if (n <= 1) return "1y";
    if (n <= 3) return "3y";
    return "4y";
  }

  return "custom";
}

export function catalogExperienceLabel(program: CatalogMetaProgram): string {
  const raw = program.eligibilitySummary?.replace(/\s+/g, " ").trim();
  if (!raw) return "Not mandatory";
  if (/teacher|faculty|educator|principal|hod/i.test(raw)) return "Educators";

  // An open-ended figure ("7–15+ years") wins over a closed range.
  const plus = raw.match(/(?:\d+\s*[-–]\s*)?(\d+)\+\s*years?/i);
  if (plus) return `${plus[1]}+ years`;
  const range = raw.match(/(\d+)\s*[-–]\s*(\d+)\s*years?/i);
  if (range) return `${range[1]}-${range[2]} years`;

  // Individual-learner signals are checked before institutional ones, because
  // words like "enterprise" usually describe the work context, not the audience.
  if (/student|fresher|young graduate|no prior/i.test(raw)) return "0-2 years";
  if (
    /executive|cto|vp|senior leader|senior professional|senior technology/i.test(
      raw,
    )
  ) {
    return "5+ years";
  }
  if (/working professional/i.test(raw)) return "2+ years";
  if (/manager/i.test(raw)) return "8+ years";
  if (/college|universit|institution/i.test(raw)) return "Institutions";
  return "Not mandatory";
}

export function catalogExperienceKey(program: CatalogMetaProgram): string {
  const label = catalogExperienceLabel(program);
  if (label === "Educators") return "educators";
  if (label === "Institutions") return "institution";
  if (label === "Not mandatory") return "none";
  if (label === "0-2 years") return "0-2";
  const plus = label.match(/^(\d+)\+\s*years$/i);
  if (plus) return `${plus[1]}plus`;
  const range = label.match(/^(\d+)-(\d+)\s*years$/i);
  if (range) return `${range[1]}-${range[2]}`;
  return "none";
}
