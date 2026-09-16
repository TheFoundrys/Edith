import { prisma } from "@/lib/db";
import {
  buildCourseMcqPaper,
  type McqDisplayQuestion,
  displayQuestionsForPaper,
} from "@/lib/assessments/course-mcq-paper";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import type { KryptonMcqPaper } from "@/lib/assessments/krypton";

export async function getOrCreateCourseMcqAttempt(opts: {
  userId: string;
  organizationId: string;
  programId: string;
  courseMcq: {
    id: string;
    questions: unknown;
    totalQuestions: number;
  };
}) {
  const bank = parseMcqQuestions(opts.courseMcq.questions);
  if (bank.length === 0) {
    return { error: "No questions in bank." as const };
  }

  const inProgress = await prisma.courseAssessmentAttempt.findFirst({
    where: {
      userId: opts.userId,
      courseMcqId: opts.courseMcq.id,
      submittedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });

  if (inProgress?.metadata && isPaperMetadata(inProgress.metadata)) {
    const paper = inProgress.metadata.paper;
    return {
      ok: true as const,
      attemptId: inProgress.id,
      paper,
      displayQuestions: displayQuestionsForPaper(bank, paper),
      bank,
    };
  }

  const priorCount = await prisma.courseAssessmentAttempt.count({
    where: { userId: opts.userId, courseMcqId: opts.courseMcq.id },
  });

  const attempt = await prisma.courseAssessmentAttempt.create({
    data: {
      organizationId: opts.organizationId,
      programId: opts.programId,
      courseMcqId: opts.courseMcq.id,
      userId: opts.userId,
      attemptNumber: priorCount + 1,
      totalQuestions: Math.min(opts.courseMcq.totalQuestions, bank.length),
      source: "MANUAL",
    },
  });

  const paper = buildCourseMcqPaper(bank, {
    attemptId: attempt.id,
    questionCount: opts.courseMcq.totalQuestions,
    shuffleOptions: true,
  });

  await prisma.courseAssessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      metadata: { paper } satisfies PaperMetadata,
      totalQuestions: paper.questionIds.length,
    },
  });

  return {
    ok: true as const,
    attemptId: attempt.id,
    paper,
    displayQuestions: displayQuestionsForPaper(bank, paper),
    bank,
  };
}

type PaperMetadata = { paper: KryptonMcqPaper };

function isPaperMetadata(value: unknown): value is PaperMetadata {
  if (!value || typeof value !== "object") return false;
  const paper = (value as PaperMetadata).paper;
  return Boolean(paper && Array.isArray(paper.questionIds));
}

export function readCourseMcqPaperFromMetadata(
  metadata: unknown,
): KryptonMcqPaper | null {
  if (!isPaperMetadata(metadata)) return null;
  return metadata.paper;
}

export type CourseMcqSession = {
  attemptId: string;
  paper: KryptonMcqPaper;
  displayQuestions: McqDisplayQuestion[];
  bank: ReturnType<typeof parseMcqQuestions>;
};
