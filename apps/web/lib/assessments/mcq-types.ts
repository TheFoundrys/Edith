export type McqQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export function parseMcqQuestions(raw: unknown): McqQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const options = Array.isArray(record.options)
        ? record.options.map(String)
        : [];
      const correctRaw =
        record.correctIndex ?? record.correctAnswer ?? record.answer;
      const correctIndex = Number(correctRaw);
      if (options.length < 2 || Number.isNaN(correctIndex)) return null;
      return {
        id: String(record.id ?? `q-${index + 1}`),
        prompt: String(record.prompt ?? record.question ?? ""),
        options,
        correctIndex,
      };
    })
    .filter((item): item is McqQuestion => Boolean(item?.prompt));
}

export function scoreMcqAnswers(
  questions: McqQuestion[],
  answers: Record<string, number>,
  passingScore = 70,
) {
  let correct = 0;
  for (const question of questions) {
    if (answers[question.id] === question.correctIndex) correct += 1;
  }
  const total = questions.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, percentage, passed: percentage >= passingScore };
}

export function normalizeMcqQuestion(input: {
  prompt: string;
  options: string[];
  correctIndex: number;
  id?: string;
}): McqQuestion | null {
  const prompt = input.prompt.trim();
  const options = input.options.map((o) => o.trim()).filter(Boolean);
  if (!prompt || options.length < 2) return null;
  if (
    input.correctIndex < 0 ||
    input.correctIndex >= options.length ||
    Number.isNaN(input.correctIndex)
  ) {
    return null;
  }
  return {
    id: input.id ?? `q-${Math.random().toString(36).slice(2, 10)}`,
    prompt,
    options,
    correctIndex: input.correctIndex,
  };
}
