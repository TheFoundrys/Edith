"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { McqGenerationStatus, McqSource } from "@prisma/client";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  generateMcqQuestionsWithAi,
} from "@/lib/assessments/mcq-ai-generate";
import { lessonMcqAiTopic } from "@/lib/assessments/course-mcq-ai";
import { programOutline } from "@/lib/assessments/syllabus-outline";
import { importMcqQuestionsFromJson } from "@/lib/assessments/mcq-import";
import { resolveMcqStatusAfterImport } from "@/lib/assessments/mcq-publish";
import { stripYouTubeUrls } from "@/lib/learning/youtube-content";
import {
  normalizeMcqQuestion,
  parseMcqQuestions,
  type McqQuestion,
} from "@/lib/assessments/mcq-types";

function revalidateLessonMcqPaths(
  programId: string,
  lessonId: string,
  mcqId?: string,
) {
  revalidatePath("/admin/lesson-mcqs");
  if (mcqId) revalidatePath(`/admin/lesson-mcqs/${mcqId}`);
  revalidatePath(`/student/learning/${programId}/lessons/${lessonId}`);
  revalidatePath(`/student/learning/${programId}/lessons/${lessonId}/mcq`);
  revalidatePath("/student/assessments");
  revalidatePath(`/student/learning/${programId}`);
}

function readOptions(formData: FormData) {
  return [0, 1, 2, 3].map((index) =>
    String(formData.get(`option${index}`) || "").trim(),
  );
}

export async function createLessonMcqSetAction(formData: FormData) {
  await createLessonMcqSet(formData);
}

export async function createLessonMcqSet(formData: FormData) {
  const session = await requireCapability("manageContent");
  const lessonId = String(formData.get("lessonId") || "").trim();
  const passingScore = Number(formData.get("passingScore") || 70);

  if (!lessonId) return { error: "Lesson is required." };

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      module: {
        syllabus: {
          program: { organizationId: session.user.organizationId },
        },
      },
    },
    include: {
      module: {
        select: {
          syllabus: { select: { programId: true } },
        },
      },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  const programId = lesson.module.syllabus.programId;
  const existing = await prisma.lessonMcq.findFirst({
    where: { lessonId, programId },
  });
  if (existing) {
    redirect(`/admin/lesson-mcqs/${existing.id}`);
  }

  const mcq = await prisma.lessonMcq.create({
    data: {
      organizationId: session.user.organizationId,
      lessonId,
      programId,
      questions: [],
      passingScore: Number.isFinite(passingScore)
        ? Math.max(0, Math.min(100, passingScore))
        : 70,
      status: McqGenerationStatus.PENDING,
      source: "MANUAL",
      isActive: true,
    },
  });

  revalidateLessonMcqPaths(programId, lessonId, mcq.id);
  revalidatePath(`/admin/syllabus/${programId}`);
  revalidatePath("/admin/syllabus");
  redirect(`/admin/lesson-mcqs/${mcq.id}`);
}

export async function addLessonMcqQuestionAction(formData: FormData) {
  await addLessonMcqQuestion(formData);
}

export async function addLessonMcqQuestion(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const prompt = String(formData.get("prompt") || "").trim();
  const options = readOptions(formData);
  const correctIndex = Number(formData.get("correctIndex") || 0);

  const question = normalizeMcqQuestion({ prompt, options, correctIndex });
  if (!question) return { error: "Enter a prompt, at least two options, and the correct answer." };

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "Lesson quiz not found." };

  const bank = [...parseMcqQuestions(mcq.questions), question];
  await prisma.lessonMcq.update({
    where: { id: mcq.id },
    data: {
      questions: bank as unknown as McqQuestion[],
      status: McqGenerationStatus.READY,
      isActive: true,
    },
  });

  revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
}

export async function deleteLessonMcqQuestionAction(formData: FormData) {
  await deleteLessonMcqQuestion(formData);
}

export async function deleteLessonMcqQuestion(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const questionId = String(formData.get("questionId") || "").trim();

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return;

  const bank = parseMcqQuestions(mcq.questions).filter((q) => q.id !== questionId);
  await prisma.lessonMcq.update({
    where: { id: mcq.id },
    data: {
      questions: bank as unknown as McqQuestion[],
      status:
        bank.length === 0
          ? McqGenerationStatus.PENDING
          : mcq.status === McqGenerationStatus.READY
            ? McqGenerationStatus.READY
            : McqGenerationStatus.PENDING,
    },
  });

  revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
}

export async function updateLessonMcqSettingsAction(formData: FormData) {
  await updateLessonMcqSettings(formData);
}

export async function updateLessonMcqSettings(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const passingScore = Number(formData.get("passingScore") || 70);

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return;

  await prisma.lessonMcq.update({
    where: { id: mcq.id },
    data: {
      passingScore: Number.isFinite(passingScore)
        ? Math.max(0, Math.min(100, passingScore))
        : mcq.passingScore,
    },
  });

  revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
}

export async function publishLessonMcqAction(formData: FormData) {
  await publishLessonMcq(formData);
}

export async function publishLessonMcq(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "Lesson quiz not found." };

  const bank = parseMcqQuestions(mcq.questions);
  if (bank.length === 0) {
    return { error: "Add at least one question before publishing." };
  }

  await prisma.lessonMcq.update({
    where: { id: mcq.id },
    data: {
      status: McqGenerationStatus.READY,
      isActive: true,
    },
  });

  revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
}

export async function importLessonMcqJsonAction(formData: FormData) {
  return importLessonMcqJson(formData);
}

export async function importLessonMcqJson(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const jsonText = String(formData.get("json") || "");
  const replace = formData.get("replace") === "on";

  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "Lesson quiz not found." };

  const bank = parseMcqQuestions(mcq.questions);
  const result = importMcqQuestionsFromJson(jsonText, bank, { replace });
  if (!result.ok) return { error: result.error };

  const wasReady = mcq.status === McqGenerationStatus.READY;
  const { status, needsRepublish } = resolveMcqStatusAfterImport({
    wasReady,
    replace,
  });
  const nextStatus =
    result.questions.length === 0
      ? McqGenerationStatus.PENDING
      : replace
        ? status
        : McqGenerationStatus.READY;

  await prisma.lessonMcq.update({
    where: { id: mcq.id },
    data: {
      questions: result.questions as unknown as McqQuestion[],
      status: nextStatus,
      isActive: result.questions.length > 0,
    },
  });

  revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
  return {
    ok: true as const,
    imported: result.imported,
    skipped: result.skipped,
    total: result.questions.length,
    needsRepublish: replace && result.questions.length > 0,
  };
}

async function lessonQuizOutline(programId: string, lesson: {
  title: string;
  summary: string | null;
  content: string;
  moduleTitle: string;
  moduleSummary: string | null;
}) {
  const modules = await prisma.syllabusModule.findMany({
    where: { syllabus: { programId } },
    orderBy: { order: "asc" },
    include: {
      lessons: {
        orderBy: { order: "asc" },
        select: { title: true, summary: true },
      },
    },
  });
  const reading = stripYouTubeUrls(lesson.content ?? "").slice(0, 3500);
  const lessonBlock = [
    `Module: ${lesson.moduleTitle}`,
    lesson.moduleSummary ? `Module summary: ${lesson.moduleSummary}` : null,
    `Lesson: ${lesson.title}`,
    lesson.summary ? `Lesson summary: ${lesson.summary}` : null,
    reading ? `Lesson reading:\n${reading}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  const course = programOutline(
    modules.map((mod) => ({
      title: mod.title,
      summary: mod.summary,
      lessons: mod.lessons,
    })),
  );
  return [lessonBlock, course].filter(Boolean).join("\n\n");
}

export async function generateLessonMcqWithAi(input: {
  mcqId: string;
  topic?: string;
  questionCount?: number;
  replace?: boolean;
}) {
  if (isCompassDatabase()) {
    return { error: "AI lesson quizzes are not available on compass_dev." };
  }

  const session = await requireCapability("manageContent");
  const mcq = await prisma.lessonMcq.findFirst({
    where: { id: input.mcqId, organizationId: session.user.organizationId },
    include: {
      lesson: {
        select: {
          title: true,
          summary: true,
          content: true,
          module: { select: { title: true, summary: true } },
        },
      },
      program: { select: { title: true, description: true } },
    },
  });
  if (!mcq) return { error: "Lesson quiz not found." };

  const questionCount = Math.min(Math.max(input.questionCount ?? 5, 3), 15);
  const replace = input.replace !== false;
  const outline = await lessonQuizOutline(mcq.programId, {
    title: mcq.lesson.title,
    summary: mcq.lesson.summary,
    content: mcq.lesson.content,
    moduleTitle: mcq.lesson.module.title,
    moduleSummary: mcq.lesson.module.summary,
  });

  try {
    const generated = await generateMcqQuestionsWithAi({
      organizationId: session.user.organizationId,
      programName: mcq.program.title,
      programSummary: mcq.program.description,
      syllabusOutline: outline,
      topic: lessonMcqAiTopic({
        lessonTitle: mcq.lesson.title,
        extraTopic: input.topic,
      }),
      questionCount,
      difficulty: "intro",
    });
    const existing = parseMcqQuestions(mcq.questions);
    const questions = replace
      ? generated.questions
      : [...existing, ...generated.questions];

    await prisma.lessonMcq.update({
      where: { id: mcq.id },
      data: {
        questions: questions as unknown as McqQuestion[],
        status: McqGenerationStatus.READY,
        source: McqSource.AI_GENERATED,
        isActive: true,
      },
    });
    revalidateLessonMcqPaths(mcq.programId, mcq.lessonId, mcq.id);
    revalidatePath(`/admin/syllabus/${mcq.programId}`);
    return {
      ok: true as const,
      provider: generated.provider,
      imported: generated.questions.length,
      total: questions.length,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI generation failed.",
    };
  }
}

/** Create the lesson quiz if needed, then fill it from AI and publish. */
export async function generateLessonMcqForLessonWithAi(input: {
  lessonId: string;
  topic?: string;
  questionCount?: number;
}) {
  if (isCompassDatabase()) {
    return { error: "AI lesson quizzes are not available on compass_dev." };
  }

  const session = await requireCapability("manageContent");
  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: input.lessonId,
      module: {
        syllabus: {
          program: { organizationId: session.user.organizationId },
        },
      },
    },
    include: {
      module: {
        select: { syllabus: { select: { programId: true } } },
      },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  const programId = lesson.module.syllabus.programId;
  let mcq = await prisma.lessonMcq.findFirst({
    where: { lessonId: lesson.id, programId },
  });
  if (!mcq) {
    mcq = await prisma.lessonMcq.create({
      data: {
        organizationId: session.user.organizationId,
        lessonId: lesson.id,
        programId,
        questions: [],
        passingScore: 70,
        status: McqGenerationStatus.PENDING,
        source: McqSource.AI_GENERATED,
        isActive: true,
      },
    });
  }

  return generateLessonMcqWithAi({
    mcqId: mcq.id,
    topic: input.topic,
    questionCount: input.questionCount,
    replace: true,
  });
}

