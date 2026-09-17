import { prisma } from "@/lib/db";
import {
  buildCourseMcqPaper,
  displayQuestionsForPaper,
} from "@/lib/assessments/course-mcq-paper";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import type { KryptonMcqPaper } from "@/lib/assessments/krypton";

type PaperPayload = { paper: KryptonMcqPaper };

function isPaperPayload(value: unknown): value is PaperPayload {
  if (!value || typeof value !== "object") return false;
  const paper = (value as PaperPayload).paper;
  return Boolean(paper && Array.isArray(paper.questionIds));
}

export async function getOrCreateLessonMcqAttempt(opts: {
  userId: string;
  lessonMcq: {
    id: string;
    questions: unknown;
    passingScore: number;
  };
  lessonId: string;
}) {
  const bank = parseMcqQuestions(opts.lessonMcq.questions);
  if (bank.length === 0) {
    return { error: "No questions in bank." as const };
  }

  const inProgress = await prisma.lessonMcqAttempt.findFirst({
    where: {
      userId: opts.userId,
      lessonMcqId: opts.lessonMcq.id,
      submittedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (inProgress?.answers && isPaperPayload(inProgress.answers)) {
    const paper = inProgress.answers.paper;
    return {
      ok: true as const,
      attemptId: inProgress.id,
      displayQuestions: displayQuestionsForPaper(bank, paper),
    };
  }

  const priorCount = await prisma.lessonMcqAttempt.count({
    where: { userId: opts.userId, lessonMcqId: opts.lessonMcq.id },
  });

  const attempt = await prisma.lessonMcqAttempt.create({
    data: {
      lessonMcqId: opts.lessonMcq.id,
      lessonId: opts.lessonId,
      userId: opts.userId,
      attemptNumber: priorCount + 1,
      source: "MANUAL",
    },
  });

  const paper = buildCourseMcqPaper(bank, {
    attemptId: attempt.id,
    questionCount: bank.length,
    shuffleOptions: true,
  });

  await prisma.lessonMcqAttempt.update({
    where: { id: attempt.id },
    data: {
      questionIds: paper.questionIds,
      answers: { paper } satisfies PaperPayload,
      totalQuestions: paper.questionIds.length,
    },
  });

  return {
    ok: true as const,
    attemptId: attempt.id,
    displayQuestions: displayQuestionsForPaper(bank, paper),
  };
}

export function readLessonMcqPaper(answers: unknown): KryptonMcqPaper | null {
  if (!isPaperPayload(answers)) return null;
  return answers.paper;
}

export function parseLessonMcqUserAnswers(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(raw);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}
