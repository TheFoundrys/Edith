"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pickRandomCourseMcqSet } from "@/lib/assessments/course-mcq-sets";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { readCourseMcqPaperFromMetadata } from "@/lib/actions/course-mcq-session";
import { scorePaperAnswers } from "@/lib/assessments/course-mcq-paper";
import { parseMcqQuestions } from "@/lib/assessments/mcq-types";

export async function startRandomCourseMcqAction(formData: FormData) {
  const session = await requireStudent();
  const programId = String(formData.get("programId") || "").trim();
  if (!programId) return { error: "Course not found." };

  const banks = await prisma.courseMcq.findMany({
    where: {
      programId,
      organizationId: session.user.organizationId,
      isActive: true,
      status: "READY",
    },
    select: { id: true },
  });

  if (banks.length === 0) {
    return { error: "No published assessment sets for this course." };
  }

  const picked =
    banks.length === 1 ? banks[0]! : pickRandomCourseMcqSet(banks)!;
  redirect(`/student/my-courses/${programId}/mcq/${picked.id}`);
}

export async function submitCourseMcqAttemptAction(formData: FormData) {
  await submitCourseMcqAttempt(formData);
}

export async function submitCourseMcqAttempt(formData: FormData) {
  const session = await requireStudent();
  const attemptId = String(formData.get("attemptId") || "").trim();
  const programId = String(formData.get("programId") || "").trim();
  const mcqId = String(formData.get("mcqId") || "").trim();
  if (!attemptId || !programId) {
    return { error: "Assessment session expired. Refresh and try again." };
  }

  const attempt = await prisma.courseAssessmentAttempt.findFirst({
    where: {
      id: attemptId,
      userId: session.user.id,
      programId,
      submittedAt: null,
    },
    include: {
      courseMcq: true,
    },
  });
  if (!attempt?.courseMcq) return { error: "Assessment not found." };

  const mcq = attempt.courseMcq;
  if (!mcq.isActive || mcq.status !== "READY") {
    return { error: "This assessment is not available." };
  }

  const bank = parseMcqQuestions(mcq.questions);
  const paper = readCourseMcqPaperFromMetadata(attempt.metadata);
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

  await prisma.courseAssessmentAttempt.update({
    where: { id: attempt.id },
    data: {
      userAnswers: answers,
      totalQuestions: result.total,
      correctAnswers: result.correct,
      percentage: result.percentage,
      submittedAt: new Date(),
      passed: result.passed,
      score: result.percentage,
      maxScore: 100,
    },
  });

  const mcqPath = mcqId
    ? `/student/my-courses/${programId}/mcq/${mcqId}`
    : `/student/my-courses/${programId}/mcq/${mcq.id}`;
  revalidatePath(`/student/my-courses/${programId}/mcq`);
  revalidatePath(mcqPath);
  revalidatePath("/student/assessments");
  redirect(`${mcqPath}?result=submitted`);
}
