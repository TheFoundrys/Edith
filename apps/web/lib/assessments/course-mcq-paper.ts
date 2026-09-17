import {
  applyOptionMap,
  buildKryptonMcqPaper,
  kryptonSeed,
  originalOptionIndex,
  type KryptonMcqPaper,
} from "@/lib/assessments/krypton";
import type { McqQuestion } from "@/lib/assessments/mcq-types";

export type McqDisplayQuestion = {
  id: string;
  prompt: string;
  options: string[];
};

/** Build a reproducible randomized paper for one attempt. */
export function buildCourseMcqPaper(
  bank: McqQuestion[],
  opts: {
    attemptId: string;
    questionCount: number;
    shuffleOptions?: boolean;
  },
): KryptonMcqPaper {
  if (bank.length === 0) {
    return { questionIds: [], optionMaps: {} };
  }

  const count = Math.max(1, Math.min(opts.questionCount, bank.length));
  const seed = kryptonSeed(opts.attemptId, "course-mcq");
  const allIds = bank.map((q) => q.id);

  // Select + order questions in one seeded shuffle (take first N after permute).
  const fullPaper = buildKryptonMcqPaper(
    allIds,
    Object.fromEntries(bank.map((q) => [q.id, q.options.length])),
    seed,
    opts.shuffleOptions ?? true,
  );
  const questionIds = fullPaper.questionIds.slice(0, count);
  const optionMaps: Record<string, number[]> = {};
  for (const id of questionIds) {
    optionMaps[id] = fullPaper.optionMaps[id] ?? [];
  }
  return { questionIds, optionMaps };
}

export function displayQuestionsForPaper(
  bank: McqQuestion[],
  paper: KryptonMcqPaper,
): McqDisplayQuestion[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return paper.questionIds
    .map((id) => {
      const question = byId.get(id);
      if (!question) return null;
      return {
        id: question.id,
        prompt: question.prompt,
        options: applyOptionMap(question.options, paper.optionMaps[id]),
      };
    })
    .filter((q): q is McqDisplayQuestion => q != null);
}

export function scorePaperAnswers(
  bank: McqQuestion[],
  paper: KryptonMcqPaper,
  answers: Record<string, number>,
  passingScore = 70,
) {
  const byId = new Map(bank.map((q) => [q.id, q]));
  let correct = 0;
  let total = 0;

  for (const questionId of paper.questionIds) {
    const question = byId.get(questionId);
    if (!question) continue;
    total += 1;
    const displayed = answers[questionId];
    if (displayed == null || Number.isNaN(displayed)) continue;
    const original = originalOptionIndex(paper, questionId, displayed);
    if (original === question.correctIndex) correct += 1;
  }

  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  return {
    correct,
    total,
    percentage,
    passed: percentage >= passingScore,
  };
}

export type McqReviewQuestion = McqDisplayQuestion & {
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
};

/** Rebuild the shuffled paper with selected vs correct options for results. */
export function reviewQuestionsForPaper(
  bank: McqQuestion[],
  paper: KryptonMcqPaper,
  answers: Record<string, number>,
): McqReviewQuestion[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return paper.questionIds
    .map((id) => {
      const question = byId.get(id);
      if (!question) return null;
      const options = applyOptionMap(question.options, paper.optionMaps[id]);
      const correctIndex = options.findIndex(
        (_option, index) =>
          originalOptionIndex(paper, id, index) === question.correctIndex,
      );
      const raw = answers[id];
      const selectedIndex =
        raw == null || Number.isNaN(raw) ? null : Number(raw);
      return {
        id: question.id,
        prompt: question.prompt,
        options,
        selectedIndex,
        correctIndex,
        isCorrect:
          selectedIndex != null &&
          originalOptionIndex(paper, id, selectedIndex) ===
            question.correctIndex,
      };
    })
    .filter((q): q is McqReviewQuestion => q != null);
}
