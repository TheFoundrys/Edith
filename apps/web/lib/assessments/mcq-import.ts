import {
  normalizeMcqQuestion,
  parseMcqQuestions,
  type McqQuestion,
} from "@/lib/assessments/mcq-types";

export type McqImportResult =
  | { ok: true; questions: McqQuestion[]; imported: number; skipped: number }
  | { ok: false; error: string };

/** Parse bulk JSON: array of questions or `{ "questions": [...] }`. */
export function parseMcqImportPayload(raw: unknown): McqQuestion[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { questions?: unknown }).questions)
      ? (raw as { questions: unknown[] }).questions
      : null;

  if (!list) return [];
  return parseMcqQuestions(list);
}

export function importMcqQuestionsFromJson(
  jsonText: string,
  existingBank: McqQuestion[],
  opts?: { replace?: boolean },
): McqImportResult {
  const trimmed = jsonText.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a JSON array of questions." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Invalid JSON. Check brackets and quotes." };
  }

  const imported = parseMcqImportPayload(parsed);
  if (imported.length === 0) {
    return {
      ok: false,
      error:
        'No valid questions found. Each item needs prompt (or question), options (2+), and correctIndex (or correctAnswer).',
    };
  }

  const existingIds = new Set(existingBank.map((q) => q.id));
  const normalized: McqQuestion[] = [];
  let skipped = 0;

  for (const item of imported) {
    const question = normalizeMcqQuestion({
      id: existingIds.has(item.id)
        ? `q-${Math.random().toString(36).slice(2, 10)}`
        : item.id,
      prompt: item.prompt,
      options: item.options,
      correctIndex: item.correctIndex,
    });
    if (!question) {
      skipped += 1;
      continue;
    }
    existingIds.add(question.id);
    normalized.push(question);
  }

  if (normalized.length === 0) {
    return { ok: false, error: "All rows were invalid after validation." };
  }

  const questions = opts?.replace
    ? normalized
    : [...existingBank, ...normalized];

  return {
    ok: true,
    questions,
    imported: normalized.length,
    skipped,
  };
}

export const MCQ_IMPORT_EXAMPLE = `[
  {
    "prompt": "What is 2 + 2?",
    "options": ["3", "4", "5"],
    "correctIndex": 1
  },
  {
    "question": "Capital of India?",
    "options": ["Mumbai", "New Delhi", "Kolkata"],
    "correctAnswer": 1
  }
]`;
