import type { ProgramCategory } from "@prisma/client";

/** Categories from The Foundry's inquiry / lead form engine */
export const PROGRAM_CATEGORIES: {
  value: ProgramCategory;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "UNDERGRADUATE_DEGREE",
    label: "Undergraduate Degrees",
    shortLabel: "Degree",
    description:
      "Three-year on-campus degrees across the Schools of Deep Tech, Entrepreneurship, Sustainability and Energy.",
  },
  {
    value: "YOUNG_POST_GRADUATE",
    label: "YGP (Young Graduate Program)",
    shortLabel: "YGP",
    description:
      "Foundational programmes for students and young graduates in emerging deep tech.",
  },
  {
    value: "POST_GRADUATE",
    label: "PGP (Post Graduate Program)",
    shortLabel: "PGP",
    description:
      "Post graduate programmes for professionals accelerating in AI, Cybersecurity and deep tech.",
  },
  {
    value: "FELLOW_EXECUTIVE",
    label: "Fellowship & Executive Programs",
    shortLabel: "Fellow / Executive",
    description:
      "Fellowship and executive programmes in AI, Cybersecurity, leadership and tech strategy.",
  },
  {
    value: "ADVANCED_MANAGEMENT",
    label: "Advanced Management Program",
    shortLabel: "AMP",
    description:
      "Advanced management programmes in AI, Cybersecurity, digital transformation and general management.",
  },
  {
    value: "FACULTY_DEVELOPMENT",
    label: "Faculty Development Programs",
    shortLabel: "FDP",
    description:
      "Train-the-trainer certifications for school teachers, college faculty and institutional leaders.",
  },
  {
    value: "CERTIFICATION",
    label: "Certifications",
    shortLabel: "Certification",
    description:
      "Short, standalone certifications and bootcamps in AI, Cybersecurity, Quantum and Blockchain.",
  },
  {
    value: "CENTRE_OF_EXCELLENCE",
    label: "Centre of Excellence (CoE)",
    shortLabel: "CoE",
    description:
      "Institutional Centres of Excellence in AI & Data Science, Cybersecurity, Blockchain and Quantum.",
  },
];

export function parseProgramCategory(
  value: string | undefined | null,
): ProgramCategory | undefined {
  if (!value) return undefined;
  return PROGRAM_CATEGORIES.find((c) => c.value === value)?.value;
}

export function programCategoryLabel(category: ProgramCategory) {
  return PROGRAM_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

/** Short catalog title — drops redundant track prefixes (chip already shows track). */
export function displayProgramName(
  name: string,
  category?: ProgramCategory | null,
): string {
  let title = name.replace(/\s+/g, " ").trim();
  if (!title) return title;

  if (!category || category === "ADVANCED_MANAGEMENT") {
    const next = title.replace(
      /^Advanced Management Program(?:me)?\s+in\s+/i,
      "",
    );
    if (next !== title) title = next;
  }

  if (!category || category === "YOUNG_POST_GRADUATE") {
    const next = title.replace(/^Young Graduate Program(?:me)?\s+in\s+/i, "");
    if (next !== title) title = next;
  }

  if (!category || category === "POST_GRADUATE") {
    const next = title.replace(/^Post Graduate Program(?:me)?\s+in\s+/i, "");
    if (next !== title) title = next;
  }

  if (!category || category === "CENTRE_OF_EXCELLENCE") {
    const next = title.replace(/^(?:CoE|Centre of Excellence)\s+in\s+/i, "");
    if (next !== title) title = next;
  }

  if (!category || category === "FELLOW_EXECUTIVE") {
    const fellowship = title.replace(/^Fellowship\s+in\s+/i, "");
    if (fellowship !== title) {
      title = fellowship;
    } else {
      const executive = title.replace(/^Executive Program(?:me)?\s+in\s+/i, "");
      if (executive !== title) title = executive;
    }
  }

  return normalizeAiMlLabel(title);
}

/** Prefer AI/ML over bare "AI" in short titles. */
function normalizeAiMlLabel(title: string): string {
  if (/^AI\s*\/\s*ML$/i.test(title)) return "AI/ML";
  if (/^AI$/i.test(title)) return "AI/ML";
  if (/^AI\s+Leadership\b/i.test(title)) {
    return title.replace(/^AI\b/i, "AI/ML");
  }
  return title;
}
