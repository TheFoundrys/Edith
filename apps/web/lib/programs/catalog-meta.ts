import type { DegreeLevel, ProgramCategory } from "@prisma/client";

export type CatalogMetaProgram = {
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  eligibilitySummary: string | null;
  campus: { name: string } | null;
};

export function catalogMode(program: CatalogMetaProgram): string {
  if (program.category === "CENTRE_OF_EXCELLENCE") return "Institutional / Hybrid";
  if (program.category === "FELLOW_EXECUTIVE") return "Hybrid";
  if (program.category === "ADVANCED_MANAGEMENT") {
    return "On-campus and Live-online";
  }
  if (program.campus) return "On-campus and Live-online";
  return "Hybrid";
}

export function catalogDurationLabel(program: CatalogMetaProgram): string {
  if (program.slug === "delivering-in-the-age-of-ai") return "2 Days";
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

export function catalogDurationKey(program: CatalogMetaProgram): string {
  const label = catalogDurationLabel(program);
  switch (label) {
    case "2 Days":
      return "2d";
    case "13 Weeks":
      return "13w";
    case "Cohort-based":
      return "cohort";
    case "Custom":
      return "custom";
    case "3 Years":
      return "3y";
    case "3+1 Years":
      return "3p1y";
    case "1–2 Years":
      return "1-2y";
    case "Program-dependent":
      return "program";
    default:
      return "custom";
  }
}

export function catalogExperienceLabel(program: CatalogMetaProgram): string {
  const raw = program.eligibilitySummary?.replace(/\s+/g, " ").trim();
  if (!raw) return "Not mandatory";
  if (/college|universit|enterprise|institution|coe/i.test(raw)) {
    return "Institutions";
  }
  const range = raw.match(/(\d+)\s*[-–]\s*(\d+)\s*years?/i);
  if (range) return `${range[1]}-${range[2]} years`;
  const plus = raw.match(/(\d+)\+\s*years?/i);
  if (plus) return `${plus[1]}+ years`;
  if (/student|fresher|young graduate|no prior/i.test(raw)) return "0-2 years";
  if (/working professional/i.test(raw)) return "2+ years";
  if (/executive|cto|vp|senior leader|senior professional/i.test(raw)) {
    return "5+ years";
  }
  if (/manager/i.test(raw)) return "8+ years";
  return "Not mandatory";
}

export function catalogExperienceKey(program: CatalogMetaProgram): string {
  const label = catalogExperienceLabel(program);
  if (label === "Institutions") return "institution";
  if (label === "Not mandatory") return "none";
  if (label === "0-2 years") return "0-2";
  const plus = label.match(/^(\d+)\+\s*years$/i);
  if (plus) return `${plus[1]}plus`;
  const range = label.match(/^(\d+)-(\d+)\s*years$/i);
  if (range) return `${range[1]}-${range[2]}`;
  return "none";
}
