import type { ProgramCategory } from "@prisma/client";
import { PROGRAM_CATEGORIES } from "@/lib/programs/categories";
import {
  catalogDurationKey,
  catalogExperienceKey,
  type CatalogMetaProgram,
} from "@/lib/programs/catalog-meta";

export type FinderFilterKey = "suite" | "duration" | "experience";

export type FinderFilters = Record<FinderFilterKey, string[]>;

export type FinderFilterOption = { value: string; label: string };

export type FinderFilterIndexItem = {
  category: ProgramCategory;
  duration: string;
  experience: string;
};

export const EMPTY_FINDER_FILTERS: FinderFilters = {
  suite: [],
  duration: [],
  experience: [],
};

export const SUITE_OPTIONS: FinderFilterOption[] = PROGRAM_CATEGORIES.map(
  (c) => ({
    value: c.value,
    label: c.label,
  }),
);

export const DURATION_OPTIONS: FinderFilterOption[] = [
  { value: "days", label: "A few days" },
  { value: "upto6w", label: "Up to 6 weeks" },
  { value: "6to13w", label: "6–13 weeks" },
  { value: "upto6m", label: "Up to 6 months" },
  { value: "12m", label: "12 months" },
  { value: "1y", label: "1 year" },
  { value: "3y", label: "3 years" },
  { value: "4y", label: "4 years" },
  { value: "3p1y", label: "3+1 years (integrated MBA)" },
  { value: "cohort", label: "Cohort-based" },
  { value: "program", label: "Program-dependent" },
  { value: "custom", label: "Custom" },
];

export const EXPERIENCE_OPTIONS: FinderFilterOption[] = [
  { value: "0-2", label: "0-2 years" },
  { value: "2plus", label: "2+ years" },
  { value: "5plus", label: "5+ years" },
  { value: "8plus", label: "8+ years" },
  { value: "10plus", label: "10+ years" },
  { value: "15plus", label: "15+ years" },
  { value: "none", label: "Not mandatory" },
  { value: "educators", label: "Educators" },
  { value: "institution", label: "Institutions" },
];

export const FINDER_FILTER_LABELS: Record<FinderFilterKey, string> = {
  suite: "Programme suite",
  duration: "Duration",
  experience: "Years of experience",
};

function parseList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Only options that match at least one published course. */
export function availableFinderOptions(index: FinderFilterIndexItem[]): {
  key: FinderFilterKey;
  label: string;
  options: FinderFilterOption[];
}[] {
  const suites = new Set(index.map((i) => i.category));
  const durations = new Set(index.map((i) => i.duration));
  const experiences = new Set(index.map((i) => i.experience));

  return [
    {
      key: "suite" as const,
      label: FINDER_FILTER_LABELS.suite,
      options: SUITE_OPTIONS.filter((o) => suites.has(o.value as ProgramCategory)),
    },
    {
      key: "duration" as const,
      label: FINDER_FILTER_LABELS.duration,
      options: DURATION_OPTIONS.filter((o) => durations.has(o.value)),
    },
    {
      key: "experience" as const,
      label: FINDER_FILTER_LABELS.experience,
      options: EXPERIENCE_OPTIONS.filter((o) => experiences.has(o.value)),
    },
  ].filter((group) => group.options.length > 0);
}

export function parseFinderFilters(
  params: {
    suite?: string | string[];
    duration?: string | string[];
    experience?: string | string[];
    category?: string | string[];
  },
  available?: ReturnType<typeof availableFinderOptions>,
): FinderFilters {
  const suite = parseList(params.suite);
  const legacy = parseList(params.category);
  for (const value of legacy) {
    if (!suite.includes(value)) suite.push(value);
  }

  const suiteAllowed = new Set(
    (available?.find((g) => g.key === "suite")?.options ?? SUITE_OPTIONS).map(
      (o) => o.value,
    ),
  );
  const durationAllowed = new Set(
    (
      available?.find((g) => g.key === "duration")?.options ?? DURATION_OPTIONS
    ).map((o) => o.value),
  );
  const experienceAllowed = new Set(
    (
      available?.find((g) => g.key === "experience")?.options ??
      EXPERIENCE_OPTIONS
    ).map((o) => o.value),
  );

  return {
    suite: suite.filter((v) => suiteAllowed.has(v)),
    duration: parseList(params.duration).filter((v) => durationAllowed.has(v)),
    experience: parseList(params.experience).filter((v) =>
      experienceAllowed.has(v),
    ),
  };
}

export function finderFiltersActive(filters: FinderFilters): boolean {
  return (
    filters.suite.length > 0 ||
    filters.duration.length > 0 ||
    filters.experience.length > 0
  );
}

export function programMatchesFinderFilters(
  program: CatalogMetaProgram,
  filters: FinderFilters,
): boolean {
  if (filters.suite.length > 0 && !filters.suite.includes(program.category)) {
    return false;
  }

  if (
    filters.duration.length > 0 &&
    !filters.duration.includes(catalogDurationKey(program))
  ) {
    return false;
  }

  if (
    filters.experience.length > 0 &&
    !filters.experience.includes(catalogExperienceKey(program))
  ) {
    return false;
  }

  return true;
}

export function buildFinderQuery(filters: FinderFilters): string {
  const params = new URLSearchParams();
  if (filters.suite.length) params.set("suite", filters.suite.join(","));
  if (filters.duration.length) {
    params.set("duration", filters.duration.join(","));
  }
  if (filters.experience.length) {
    params.set("experience", filters.experience.join(","));
  }
  const qs = params.toString();
  return qs ? `/courses?${qs}` : "/courses";
}
