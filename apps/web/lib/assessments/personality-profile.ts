import {
  APTITUDE_QUESTIONS,
  QUANTITATIVE_QUESTIONS,
  PSYCHE_QUESTIONS,
} from "@/lib/assessments/personality-questions";
import {
  applyOptionMap,
  type KryptonMcqPaper,
} from "@/lib/assessments/krypton";

export const PERSONALITY_PROFILE_SLUG = "edith-personality-profile";
export const PERSONALITY_PROFILE_HREF = "/student/personality-profile";
export const PERSONALITY_EXAM_HREF = `${PERSONALITY_PROFILE_HREF}/take`;
export const PERSONALITY_PROFILE_PUBLIC_HREF = "/personality-profile";
export const PERSONALITY_PROFILE_RANK_HREF = "/personality-profile/rank";
export const PERSONALITY_STUDENT_RANK_HREF = `${PERSONALITY_PROFILE_HREF}/rank`;
export const PERSONALITY_PROFILE_ENROLL_HREF = `/enroll/${PERSONALITY_PROFILE_SLUG}`;
export const PERSONALITY_PROFILE_NAME = "Edith Personality Profile";
/** Internal catalogue SKU — never show this to students. */
export const PERSONALITY_PROFILE_SKU = "ASSESS 001";

export type PersonalitySectionId = "aptitude" | "quantitative" | "psyche";

export function personalitySectionHref(_section?: PersonalitySectionId) {
  return PERSONALITY_EXAM_HREF;
}

export const BATTERY_LABELS: Record<PersonalitySectionId, string> = {
  aptitude: "Aptitude",
  quantitative: "Quantitative",
  psyche: "Psyche",
};

export function batteryForQuestionId(id: string): PersonalitySectionId | null {
  if (id.startsWith("apt-")) return "aptitude";
  if (id.startsWith("qty-")) return "quantitative";
  if (id.startsWith("psy-")) return "psyche";
  return null;
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
    summary: "30 scored questions — logical, verbal and pattern reasoning.",
    minutes: 30,
  },
  {
    id: "quantitative",
    title: "Quantitative",
    summary: "30 scored questions — numeracy, arithmetic and data interpretation.",
    minutes: 30,
  },
  {
    id: "psyche",
    title: "Qualitative psyche",
    summary: "30 work-style questions. No right or wrong answers.",
    minutes: 30,
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

export { APTITUDE_QUESTIONS, QUANTITATIVE_QUESTIONS, PSYCHE_QUESTIONS };

export const SECTION_QUESTIONS = {
  aptitude: APTITUDE_QUESTIONS,
  quantitative: QUANTITATIVE_QUESTIONS,
  psyche: PSYCHE_QUESTIONS,
} as const;

export const PERSONALITY_EXAM_QUESTION_COUNT =
  APTITUDE_QUESTIONS.length +
  QUANTITATIVE_QUESTIONS.length +
  PSYCHE_QUESTIONS.length;

export function allExamQuestionIds() {
  return [
    ...APTITUDE_QUESTIONS.map((question) => question.id),
    ...QUANTITATIVE_QUESTIONS.map((question) => question.id),
    ...PSYCHE_QUESTIONS.map((question) => question.id),
  ];
}

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
    totals[question.dimension as PsycheDimension].sum += likertValue(
      index,
      question.polarity,
    );
    totals[question.dimension as PsycheDimension].count += 1;
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

const RESUME_PROGRAMS: Record<string, { slug: string; reason: string }> = {
  ai: {
    slug: "pgp-applied-ai-genai",
    reason: "Your resume signals AI / ML experience — a professional AI track compounds it.",
  },
  cyber: {
    slug: "pgp-cybersecurity-analyst",
    reason: "Security language on your resume maps to a structured defence path.",
  },
  data: {
    slug: "cert-applied-ai-practitioner",
    reason: "Analytics skills on your resume transfer cleanly into applied AI practice.",
  },
  quantum: {
    slug: "ygp-quantum-computing",
    reason: "Quantum keywords on your resume match an emerging-tech launchpad.",
  },
  blockchain: {
    slug: "cert-blockchain-web3-developer",
    reason: "Web3 language on your resume fits a compact builder certification.",
  },
  people: {
    slug: "fdp-ai-for-educators",
    reason: "Teaching or enablement on your resume fits a faculty / people-first programme.",
  },
};

export const RESUME_TRACK_LABELS: Record<string, string> = {
  ai: "AI / machine learning",
  cyber: "cybersecurity",
  data: "data & analytics",
  quantum: "quantum",
  blockchain: "blockchain / web3",
  people: "teaching & people",
};

export function resumeSkillLabels(keywords: string[]) {
  return keywords
    .map((keyword) => RESUME_TRACK_LABELS[keyword])
    .filter((label): label is string => Boolean(label));
}

export function recommendedAssessExam(keywords: string[]) {
  const tracks = resumeSkillLabels(keywords);
  const skillLine = tracks.length
    ? `Your resume shows ${tracks.join(", ")}.`
    : "Your resume is on file.";
  return {
    title: PERSONALITY_PROFILE_NAME,
    fee: "₹3,500 + GST",
    reason: `${skillLine} The mandatory next step is the 90-question Edith Personality Profile (aptitude, quantitative, psyche). Your percentile and battery scores land on your profile.`,
  };
}

export function resumeRecommendations(
  keywords: string[],
): PersonalityRecommendation[] {
  const recs: PersonalityRecommendation[] = [];
  const seen = new Set<string>();
  for (const keyword of keywords) {
    const pick = RESUME_PROGRAMS[keyword];
    if (pick && !seen.has(pick.slug)) {
      seen.add(pick.slug);
      recs.push(pick);
    }
  }
  return recs.slice(0, 4);
}

function preferAdvanced(aptitude: ScoredBattery, quantitative: ScoredBattery) {
  return aptitude.percent >= 70 && quantitative.percent >= 60;
}

export function buildPersonalityReport(
  responses: PersonalityResponses,
  extras?: { resumeKeywords?: string[] },
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

  for (const keyword of extras?.resumeKeywords ?? []) {
    const pick = RESUME_PROGRAMS[keyword];
    if (pick && !seen.has(pick.slug) && recommendations.length < 4) {
      seen.add(pick.slug);
      recommendations.unshift(pick);
    }
  }

  return {
    aptitude,
    quantitative,
    psyche,
    insights,
    recommendations: recommendations.slice(0, 4),
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

export function isPersonalityExamComplete(responses: PersonalityResponses) {
  return completedSectionIds(responses).length === PERSONALITY_SECTIONS.length;
}

export function personalityProgress(responses: PersonalityResponses) {
  const complete = isPersonalityExamComplete(responses);
  const total = PERSONALITY_EXAM_QUESTION_COUNT;
  return {
    done: complete ? total : 0,
    total,
    pct: complete ? 100 : 0,
  };
}

export function splitExamAnswers(
  answers: Record<string, number>,
): PersonalityResponses {
  const aptitude: Record<string, number> = {};
  const quantitative: Record<string, number> = {};
  const psyche: Record<string, number> = {};
  for (const [id, value] of Object.entries(answers)) {
    const battery = batteryForQuestionId(id);
    if (battery === "aptitude") aptitude[id] = value;
    else if (battery === "quantitative") quantitative[id] = value;
    else if (battery === "psyche") psyche[id] = value;
  }
  return { aptitude, quantitative, psyche };
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
  return questionsForPaper(section, null);
}

/** Apply a Krypton paper: unique question order and (for MCQ) option order. */
export function questionsForPaper(
  section: PersonalitySectionId,
  paper: KryptonMcqPaper | null,
): { id: string; prompt: string; options: string[] }[] {
  if (section === "psyche") {
    const bank = PSYCHE_QUESTIONS;
    const ordered = paper
      ? paper.questionIds
          .map((id) => bank.find((question) => question.id === id))
          .filter((question): question is (typeof bank)[number] => Boolean(question))
      : bank;
    return ordered.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      options: [...LIKERT_OPTIONS] as string[],
    }));
  }
  const bank =
    section === "aptitude" ? APTITUDE_QUESTIONS : QUANTITATIVE_QUESTIONS;
  const ordered = paper
    ? paper.questionIds
        .map((id) => bank.find((question) => question.id === id))
        .filter((question): question is (typeof bank)[number] => Boolean(question))
    : bank;
  return ordered.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: applyOptionMap(
      question.options,
      paper?.optionMaps[question.id],
    ) as string[],
  }));
}

export type ExamQuestion = {
  id: string;
  prompt: string;
  options: string[];
  battery: PersonalitySectionId;
};

function examBankById() {
  const bank = new Map<string, ExamQuestion>();
  for (const question of APTITUDE_QUESTIONS) {
    bank.set(question.id, {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      battery: "aptitude",
    });
  }
  for (const question of QUANTITATIVE_QUESTIONS) {
    bank.set(question.id, {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      battery: "quantitative",
    });
  }
  for (const question of PSYCHE_QUESTIONS) {
    bank.set(question.id, {
      id: question.id,
      prompt: question.prompt,
      options: [...LIKERT_OPTIONS],
      battery: "psyche",
    });
  }
  return bank;
}

/** One 90-question paper. Psyche keeps Likert order; MCQ options follow Krypton. */
export function questionsForExam(paper: KryptonMcqPaper | null): ExamQuestion[] {
  const bank = examBankById();
  const orderedIds = paper?.questionIds?.length
    ? paper.questionIds.filter((id) => bank.has(id))
    : allExamQuestionIds();
  return orderedIds.map((id) => {
    const question = bank.get(id)!;
    return {
      ...question,
      options:
        question.battery === "psyche"
          ? [...LIKERT_OPTIONS]
          : (applyOptionMap(question.options, paper?.optionMaps[id]) as string[]),
    };
  });
}
