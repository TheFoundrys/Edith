export const PERSONALITY_PROFILE_SLUG = "edith-personality-profile";
export const PERSONALITY_PROFILE_HREF = "/student/personality-profile";
export const PERSONALITY_PROFILE_PUBLIC_HREF = "/personality-profile";
export const PERSONALITY_PROFILE_ENROLL_HREF = `/enroll/${PERSONALITY_PROFILE_SLUG}`;
export const PERSONALITY_PROFILE_SKU = "ASSESS 001";

export type PersonalitySectionId = "aptitude" | "quantitative" | "psyche";

export function personalitySectionHref(section: PersonalitySectionId) {
  return `${PERSONALITY_PROFILE_HREF}/take/${section}`;
}

export type PersonalityMcqQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type PsycheDimension = "drive" | "structure" | "people" | "risk";

export type PersonalityLikertQuestion = {
  id: string;
  prompt: string;
  dimension: PsycheDimension;
  /** 1 = agreement raises the dimension; -1 = agreement lowers it. */
  polarity: 1 | -1;
};

export const LIKERT_OPTIONS = [
  "Strongly disagree",
  "Disagree",
  "Agree",
  "Strongly agree",
] as const;

export const PERSONALITY_SECTIONS: {
  id: PersonalitySectionId;
  title: string;
  summary: string;
  minutes: number;
}[] = [
  {
    id: "aptitude",
    title: "Aptitude",
    summary: "Logical, verbal and pattern reasoning — scored.",
    minutes: 25,
  },
  {
    id: "quantitative",
    title: "Quantitative",
    summary: "Numeracy, arithmetic and data interpretation — scored.",
    minutes: 25,
  },
  {
    id: "psyche",
    title: "Qualitative psyche",
    summary: "Work style, motives and decision patterns. No right or wrong answers.",
    minutes: 20,
  },
];

export function isPersonalityProfileProgram(program: {
  slug?: string | null;
  domainSlug?: string | null;
  sku?: string | null;
}) {
  return (
    program.slug === PERSONALITY_PROFILE_SLUG ||
    program.domainSlug === "assessments" ||
    program.sku === PERSONALITY_PROFILE_SKU
  );
}

export function catalogHrefForProgram(program: {
  slug: string;
  domainSlug?: string | null;
  sku?: string | null;
}) {
  return isPersonalityProfileProgram(program)
    ? PERSONALITY_PROFILE_PUBLIC_HREF
    : `/courses/${program.slug}`;
}

export function afterEnrollmentHref(program: {
  id: string;
  slug?: string | null;
  domainSlug?: string | null;
  sku?: string | null;
}) {
  return isPersonalityProfileProgram(program)
    ? PERSONALITY_PROFILE_HREF
    : `/student/learning/${program.id}`;
}

export const APTITUDE_QUESTIONS: PersonalityMcqQuestion[] = [
  {
    id: "apt-01",
    prompt: "Book is to reading as fork is to…",
    options: ["Drawing", "Writing", "Stirring", "Eating"],
    correctIndex: 3,
  },
  {
    id: "apt-02",
    prompt: "Which number comes next: 2, 6, 12, 20, 30, …",
    options: ["38", "40", "42", "44"],
    correctIndex: 2,
  },
  {
    id: "apt-03",
    prompt: "All coaches are mentors. Some mentors are engineers. Which statement must be true?",
    options: [
      "All engineers are coaches",
      "Some coaches are engineers",
      "No engineer is a coach",
      "None of the above must be true",
    ],
    correctIndex: 3,
  },
  {
    id: "apt-04",
    prompt: "Find the odd one out: cube, sphere, pyramid, circle.",
    options: ["Cube", "Sphere", "Pyramid", "Circle"],
    correctIndex: 3,
  },
  {
    id: "apt-05",
    prompt: "If every coded letter is shifted two places forward (A→C, B→D), what is the code for LEAD?",
    options: ["NGCF", "MFBE", "NGCE", "OFCF"],
    correctIndex: 0,
  },
  {
    id: "apt-06",
    prompt: "A statement: “Only graduates may apply.” Which option is a valid conclusion?",
    options: [
      "Every graduate will be hired",
      "Non-graduates may not apply",
      "Graduates cannot be rejected",
      "Experience is irrelevant",
    ],
    correctIndex: 1,
  },
  {
    id: "apt-07",
    prompt: "Which pair has the same relationship as Clock : Time?",
    options: [
      "Thermometer : Heat",
      "Map : Traveller",
      "Scale : Weight",
      "Camera : Photograph",
    ],
    correctIndex: 2,
  },
  {
    id: "apt-08",
    prompt: "Complete the series: AZ, BY, CX, …",
    options: ["DW", "DU", "EV", "EW"],
    correctIndex: 0,
  },
  {
    id: "apt-09",
    prompt:
      "A team of 6 sits in a circle facing inward. Priya sits to the immediate left of Arun. Who sits to Arun’s immediate right?",
    options: [
      "Priya",
      "Cannot be determined from the information",
      "The person two seats from Priya",
      "Whoever faces Priya",
    ],
    correctIndex: 1,
  },
  {
    id: "apt-10",
    prompt:
      "“Few of the proposals were funded.” Which restatement preserves the meaning most closely?",
    options: [
      "Most proposals were funded",
      "At least some proposals were funded, and not many",
      "No proposals were funded",
      "All proposals were funded",
    ],
    correctIndex: 1,
  },
];

export const QUANTITATIVE_QUESTIONS: PersonalityMcqQuestion[] = [
  {
    id: "qty-01",
    prompt: "What is 18% of 2,500?",
    options: ["350", "400", "450", "500"],
    correctIndex: 2,
  },
  {
    id: "qty-02",
    prompt: "A ratio of 3:5 is equivalent to which percentage of the first part to the whole?",
    options: ["37.5%", "40%", "60%", "62.5%"],
    correctIndex: 0,
  },
  {
    id: "qty-03",
    prompt: "A train covers 240 km in 3 hours. At the same speed, how long for 400 km?",
    options: ["4 hours", "5 hours", "5 hours 15 min", "6 hours"],
    correctIndex: 1,
  },
  {
    id: "qty-04",
    prompt: "The average of 8, 12, 16 and 24 is…",
    options: ["14", "15", "16", "18"],
    correctIndex: 1,
  },
  {
    id: "qty-05",
    prompt: "A laptop listed at ₹40,000 is sold at a 12% discount. Sale price?",
    options: ["₹34,800", "₹35,200", "₹35,600", "₹36,000"],
    correctIndex: 1,
  },
  {
    id: "qty-06",
    prompt: "If 5 machines finish a job in 12 days, how many days for 8 identical machines?",
    options: ["6.5", "7", "7.5", "8"],
    correctIndex: 2,
  },
  {
    id: "qty-07",
    prompt: "Simple interest on ₹8,000 at 10% a year for 2 years is…",
    options: ["₹800", "₹1,200", "₹1,600", "₹1,800"],
    correctIndex: 2,
  },
  {
    id: "qty-08",
    prompt:
      "A chart shows Q1 40, Q2 55, Q3 50, Q4 75 enrolments. What is the percentage increase from Q1 to Q4?",
    options: ["75%", "87.5%", "90%", "35"],
    correctIndex: 1,
  },
  {
    id: "qty-09",
    prompt: "A mixture is 3 parts water to 2 parts concentrate. How much concentrate in 15 litres of mixture?",
    options: ["5 L", "6 L", "7.5 L", "9 L"],
    correctIndex: 1,
  },
  {
    id: "qty-10",
    prompt: "If x + 2y = 16 and y = 3, what is x?",
    options: ["8", "10", "11", "13"],
    correctIndex: 1,
  },
];

export const PSYCHE_QUESTIONS: PersonalityLikertQuestion[] = [
  {
    id: "psy-01",
    prompt: "I volunteer for stretch goals even when the outcome is uncertain.",
    dimension: "drive",
    polarity: 1,
  },
  {
    id: "psy-02",
    prompt: "I feel restless when I am not making measurable progress.",
    dimension: "drive",
    polarity: 1,
  },
  {
    id: "psy-03",
    prompt: "I would rather keep a role I have mastered than chase a harder one.",
    dimension: "drive",
    polarity: -1,
  },
  {
    id: "psy-04",
    prompt: "I prefer a written plan before I start a new project.",
    dimension: "structure",
    polarity: 1,
  },
  {
    id: "psy-05",
    prompt: "Unclear instructions bother me more than a tight deadline.",
    dimension: "structure",
    polarity: 1,
  },
  {
    id: "psy-06",
    prompt: "I am comfortable changing the plan as soon as new information appears.",
    dimension: "structure",
    polarity: -1,
  },
  {
    id: "psy-07",
    prompt: "I think out loud with others before I decide.",
    dimension: "people",
    polarity: 1,
  },
  {
    id: "psy-08",
    prompt: "Teaching someone a skill is how I know I understand it.",
    dimension: "people",
    polarity: 1,
  },
  {
    id: "psy-09",
    prompt: "I do my best work when I can stay uninterrupted and decide alone.",
    dimension: "people",
    polarity: -1,
  },
  {
    id: "psy-10",
    prompt: "I would rather try a new tool than master the one I already use.",
    dimension: "risk",
    polarity: 1,
  },
  {
    id: "psy-11",
    prompt: "Ambiguous problems energize me more than well-specified ones.",
    dimension: "risk",
    polarity: 1,
  },
  {
    id: "psy-12",
    prompt: "I wait for a proven method before I commit time to a new approach.",
    dimension: "risk",
    polarity: -1,
  },
];

export const SECTION_QUESTIONS = {
  aptitude: APTITUDE_QUESTIONS,
  quantitative: QUANTITATIVE_QUESTIONS,
  psyche: PSYCHE_QUESTIONS,
} as const;

export type ScoreBand = "Developing" | "Solid" | "Strong" | "Exceptional";

export type ScoredBattery = {
  score: number;
  max: number;
  percent: number;
  band: ScoreBand;
};

export type PsycheProfile = {
  drive: number;
  structure: number;
  people: number;
  risk: number;
  top: PsycheDimension[];
};

export type PersonalityRecommendation = {
  slug: string;
  reason: string;
};

export type PersonalityReport = {
  aptitude: ScoredBattery;
  quantitative: ScoredBattery;
  psyche: PsycheProfile;
  insights: string[];
  recommendations: PersonalityRecommendation[];
};

export type PersonalityResponses = {
  aptitude?: Record<string, number>;
  quantitative?: Record<string, number>;
  psyche?: Record<string, number>;
};

function bandForPercent(percent: number): ScoreBand {
  if (percent >= 80) return "Exceptional";
  if (percent >= 60) return "Strong";
  if (percent >= 40) return "Solid";
  return "Developing";
}

export function scoreMcqBattery(
  questions: PersonalityMcqQuestion[],
  answers: Record<string, number> | undefined,
): ScoredBattery {
  const max = questions.length;
  let score = 0;
  for (const question of questions) {
    if (answers?.[question.id] === question.correctIndex) score += 1;
  }
  const percent = max === 0 ? 0 : Math.round((score / max) * 100);
  return { score, max, percent, band: bandForPercent(percent) };
}

function likertValue(index: number, polarity: 1 | -1) {
  const raw = Math.max(0, Math.min(3, index));
  return polarity === 1 ? raw : 3 - raw;
}

export function scorePsyche(
  answers: Record<string, number> | undefined,
): PsycheProfile {
  const totals: Record<PsycheDimension, { sum: number; count: number }> = {
    drive: { sum: 0, count: 0 },
    structure: { sum: 0, count: 0 },
    people: { sum: 0, count: 0 },
    risk: { sum: 0, count: 0 },
  };

  for (const question of PSYCHE_QUESTIONS) {
    const index = answers?.[question.id];
    if (typeof index !== "number") continue;
    totals[question.dimension].sum += likertValue(index, question.polarity);
    totals[question.dimension].count += 1;
  }

  const value = (dimension: PsycheDimension) => {
    const entry = totals[dimension];
    if (entry.count === 0) return 0;
    return Math.round((entry.sum / entry.count) * 100) / 100;
  };

  const drive = value("drive");
  const structure = value("structure");
  const people = value("people");
  const risk = value("risk");
  const ranked = (
    [
      ["drive", drive],
      ["structure", structure],
      ["people", people],
      ["risk", risk],
    ] as [PsycheDimension, number][]
  ).sort((a, b) => b[1] - a[1]);

  return {
    drive,
    structure,
    people,
    risk,
    top: ranked.slice(0, 2).map(([dimension]) => dimension),
  };
}

const DIMENSION_PROGRAMS: Record<PsycheDimension, { slug: string; reason: string }[]> = {
  drive: [
    {
      slug: "pgp-applied-ai-genai",
      reason: "High drive maps to a longer professional AI track with stretch goals.",
    },
    {
      slug: "ygp-applied-ai-genai",
      reason: "Drive plus a building-from-scratch path in applied AI.",
    },
  ],
  structure: [
    {
      slug: "pgp-cybersecurity-analyst",
      reason: "A structured, control-oriented path in defence and audit.",
    },
    {
      slug: "cert-cybersecurity-analyst",
      reason: "A shorter, methodical certification in cybersecurity fundamentals.",
    },
  ],
  people: [
    {
      slug: "fdp-ai-for-educators",
      reason: "People-first style fits teaching, enablement and faculty programmes.",
    },
    {
      slug: "fdp-digital-leadership",
      reason: "Leadership through others rather than purely individual craft.",
    },
  ],
  risk: [
    {
      slug: "ygp-quantum-computing",
      reason: "Comfort with ambiguity suits an emerging-tech launchpad.",
    },
    {
      slug: "cert-blockchain-web3-developer",
      reason: "A compact track for experimenting with still-forming tooling.",
    },
  ],
};

function preferAdvanced(aptitude: ScoredBattery, quantitative: ScoredBattery) {
  return aptitude.percent >= 70 && quantitative.percent >= 60;
}

export function buildPersonalityReport(
  responses: PersonalityResponses,
): PersonalityReport {
  const aptitude = scoreMcqBattery(APTITUDE_QUESTIONS, responses.aptitude);
  const quantitative = scoreMcqBattery(
    QUANTITATIVE_QUESTIONS,
    responses.quantitative,
  );
  const psyche = scorePsyche(responses.psyche);
  const advanced = preferAdvanced(aptitude, quantitative);

  const insights: string[] = [
    `Aptitude band: ${aptitude.band} (${aptitude.score}/${aptitude.max}). ${
      aptitude.percent >= 60
        ? "Pattern and verbal reasoning are a working strength."
        : "Guided practice on logic puzzles will lift this band quickly."
    }`,
    `Quantitative band: ${quantitative.band} (${quantitative.score}/${quantitative.max}). ${
      quantitative.percent >= 60
        ? "You can hold numbers in a live problem without losing the thread."
        : "Short daily numeracy drills (percent, ratio, average) will compound."
    }`,
    psyche.top[0] === "drive"
      ? "You push for measurable progress. Pair that with a programme that has a public capstone, not only lectures."
      : psyche.top[0] === "structure"
        ? "You prefer clear methods. Cohort tracks with labs and checklists will feel more natural than open-ended studios."
        : psyche.top[0] === "people"
          ? "You learn in conversation. Faculty, hybrid and project-studio formats will keep you engaged."
          : "You tolerate unfinished maps. Emerging-tech programmes will not feel chaotic to you the way they do to others.",
    psyche.risk >= 2
      ? "You will get more from tool-heavy, fast-changing domains (AI, quantum, web3) than from a static syllabus."
      : "You will get more from proven curricula with explicit standards than from experimental stacks.",
  ];

  const recommendations: PersonalityRecommendation[] = [];
  const seen = new Set<string>();
  const order = advanced
    ? psyche.top
    : [...psyche.top].reverse();

  for (const dimension of order) {
    const options = DIMENSION_PROGRAMS[dimension];
    const pick = advanced ? options[0] : options[1] ?? options[0];
    if (pick && !seen.has(pick.slug)) {
      seen.add(pick.slug);
      recommendations.push(pick);
    }
  }

  if (recommendations.length < 3) {
    const fallback = advanced
      ? {
          slug: "cert-applied-ai-practitioner",
          reason: "A six-week certification that turns reasoning strength into a shipped project.",
        }
      : {
          slug: "ygp-applied-ai-genai",
          reason: "An all-levels launchpad that does not assume a prior technical career.",
        };
    if (!seen.has(fallback.slug)) recommendations.push(fallback);
  }

  return {
    aptitude,
    quantitative,
    psyche,
    insights,
    recommendations: recommendations.slice(0, 3),
  };
}

export function sectionAnswersComplete(
  section: PersonalitySectionId,
  answers: Record<string, number> | undefined,
) {
  const questions = SECTION_QUESTIONS[section];
  if (!answers) return false;
  return questions.every((question) => typeof answers[question.id] === "number");
}

export function completedSectionIds(responses: PersonalityResponses): PersonalitySectionId[] {
  return PERSONALITY_SECTIONS.map((section) => section.id).filter((id) =>
    sectionAnswersComplete(id, responses[id]),
  );
}

export function personalityProgress(responses: PersonalityResponses) {
  const done = completedSectionIds(responses).length;
  const total = PERSONALITY_SECTIONS.length;
  return {
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export const DIMENSION_LABELS: Record<PsycheDimension, string> = {
  drive: "Drive",
  structure: "Structure",
  people: "People",
  risk: "Exploration",
};

export function dimensionBand(value: number) {
  if (value >= 2.5) return "Signature";
  if (value >= 2) return "Pronounced";
  if (value >= 1) return "Balanced";
  return "Reserved";
}

export function publicQuestionsForSection(section: PersonalitySectionId) {
  if (section === "psyche") {
    return PSYCHE_QUESTIONS.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: [...LIKERT_OPTIONS],
    }));
  }
  const questions =
    section === "aptitude" ? APTITUDE_QUESTIONS : QUANTITATIVE_QUESTIONS;
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
  }));
}
