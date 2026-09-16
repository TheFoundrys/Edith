"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { scorePaperAnswers } from "@/lib/assessments/course-mcq-paper";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";
import { readLessonMcqPaper } from "@/lib/actions/lesson-mcq-session";

export async function submitLessonMcqAttemptAction(formData: FormData) {
  await submitLessonMcqAttempt(formData);
}

export async function submitLessonMcqAttempt(formData: FormData) {
  const session = await requireStudent();
  const attemptId = String(formData.get("attemptId") || "").trim();
  const lessonId = String(formData.get("lessonId") || "").trim();
  const programId = String(formData.get("programId") || "").trim();
  if (!attemptId || !lessonId || !programId) {
    return { error: "Quiz session expired. Refresh and try again." };
  }

  const attempt = await prisma.lessonMcqAttempt.findFirst({
    where: {
      id: attemptId,
      userId: session.user.id,
      lessonId,
      submittedAt: null,
    },
    include: { lessonMcq: true },
  });
  if (!attempt?.lessonMcq) return { error: "Quiz not found." };

  const mcq = attempt.lessonMcq;
  if (!mcq.isActive || mcq.status !== "READY") {
    return { error: "This lesson quiz is not available." };
  }

  const bank = parseMcqQuestions(mcq.questions);
  const paper = readLessonMcqPaper(attempt.answers);
  if (!paper || paper.questionIds.length === 0) {
    return { error: "Your question paper could not be loaded. Start again." };
  }

  const answers: Record<string, number> = {};
  for (const questionId of paper.questionIds) {
    const raw = formData.get(`answer_${questionId}`);
    if (raw != null && raw !== "") {
      answers[questionId] = Number(raw);
    }
  }

  const passingScore = mcq.passingScore > 0 ? mcq.passingScore : 70;
  const result = scorePaperAnswers(bank, paper, answers, passingScore);

  await prisma.lessonMcqAttempt.update({
    where: { id: attempt.id },
    data: {
      userAnswers: answers,
      totalQuestions: result.total,
      correctAnswers: result.correct,
      score: result.percentage,
      maxScore: 100,
      passed: result.passed,
      submittedAt: new Date(),
      answers: Prisma.DbNull,
    },
  });

  revalidatePath(`/student/learning/${programId}/lessons/${lessonId}/mcq`);
  redirect(
    `/student/learning/${programId}/lessons/${lessonId}/mcq?result=submitted`,
  );
}
