"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { McqGenerationStatus, McqSource } from "@prisma/client";
import { getAiAdapterForOrg } from "@/lib/ai";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  SET_AI_PROFILES,
  quizDraftToMcqQuestions,
  topicForMcqSet,
} from "@/lib/assessments/course-mcq-ai";
import {
  allocateSetNumbers,
  COURSE_MCQ_SET_COUNT,
  titleForMcqSet,
} from "@/lib/assessments/course-mcq-sets";
import { importMcqQuestionsFromJson } from "@/lib/assessments/mcq-import";
import { resolveMcqStatusAfterImport } from "@/lib/assessments/mcq-publish";
import {
  normalizeMcqQuestion,
  parseMcqQuestions,
  type McqQuestion,
} from "@/lib/assessments/mcq-types";

function revalidateCourseMcqPaths(programId: string, mcqId?: string) {
  revalidatePath("/admin/course-mcqs");
  if (mcqId) {
    revalidatePath(`/admin/course-mcqs/${mcqId}`);
    revalidatePath(`/student/my-courses/${programId}/mcq/${mcqId}`);
  }
  revalidatePath(`/student/my-courses/${programId}/mcq`);
  revalidatePath("/student/assessments");
}

function readOptions(formData: FormData) {
  return [0, 1, 2, 3].map((index) =>
    String(formData.get(`option${index}`) || "").trim(),
  );
}

export async function createCourseMcqSetAction(formData: FormData) {
  await createCourseMcqSet(formData);
}

export async function createCourseMcqSet(formData: FormData) {
  const session = await requireCapability("manageContent");
  const programId = String(formData.get("programId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const totalQuestions = Number(formData.get("totalQuestions") || 10);
  const passingScore = Number(formData.get("passingScore") || 70);

  if (!programId) return { error: "Program is required." };
  if (!title) return { error: "Title is required." };

  const program = await prisma.program.findFirst({
    where: { id: programId, organizationId: session.user.organizationId },
    select: { id: true },
  });
  if (!program) return { error: "Program not found." };

  const createThree = formData.get("createThreeSets") !== "off";
  const setCount = createThree ? COURSE_MCQ_SET_COUNT : 1;
  const perAttempt = Number.isFinite(totalQuestions)
    ? Math.max(1, totalQuestions)
    : 10;
  const pass = Number.isFinite(passingScore)
    ? Math.max(0, Math.min(100, passingScore))
    : 70;

  const existing = await prisma.courseMcq.findMany({
    where: {
      organizationId: session.user.organizationId,
      programId: program.id,
    },
    select: { setNumber: true },
  });
  const setNumbers = allocateSetNumbers(
    existing.map((row) => row.setNumber),
    setCount,
  );

  const created = [];
  for (const setNumber of setNumbers) {
    const mcq = await prisma.courseMcq.create({
      data: {
        organizationId: session.user.organizationId,
        programId: program.id,
        setNumber,
        title: titleForMcqSet(title, setNumber, setCount),
        questions: [],
        totalQuestions: perAttempt,
        passingScore: pass,
        status: McqGenerationStatus.PENDING,
        source: "MANUAL",
        isActive: true,
      },
    });
    created.push(mcq);
  }

  const first = created[0]!;
  revalidateCourseMcqPaths(program.id, first.id);
  revalidatePath(`/admin/syllabus/${program.id}`);
  revalidatePath("/admin/syllabus");
  redirect(`/admin/course-mcqs/${first.id}`);
}

export async function addCourseMcqQuestionAction(formData: FormData) {
  await addCourseMcqQuestion(formData);
}

export async function addCourseMcqQuestion(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const prompt = String(formData.get("prompt") || "").trim();
  const options = readOptions(formData);
  const correctIndex = Number(formData.get("correctIndex") || 0);

  const question = normalizeMcqQuestion({ prompt, options, correctIndex });
  if (!question) return { error: "Enter a prompt, at least two options, and the correct answer." };

  const mcq = await prisma.courseMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "MCQ set not found." };

  const bank = parseMcqQuestions(mcq.questions);
  await prisma.courseMcq.update({
    where: { id: mcq.id },
    data: {
      questions: [...bank, question] as unknown as McqQuestion[],
      status: McqGenerationStatus.PENDING,
    },
  });

  revalidateCourseMcqPaths(mcq.programId, mcq.id);
}

export async function deleteCourseMcqQuestionAction(formData: FormData) {
  await deleteCourseMcqQuestion(formData);
}

export async function deleteCourseMcqQuestion(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const questionId = String(formData.get("questionId") || "").trim();

  const mcq = await prisma.courseMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return;

  const bank = parseMcqQuestions(mcq.questions).filter((q) => q.id !== questionId);
  await prisma.courseMcq.update({
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

  revalidateCourseMcqPaths(mcq.programId, mcq.id);
}

export async function updateCourseMcqSettingsAction(formData: FormData) {
  await updateCourseMcqSettings(formData);
}

export async function updateCourseMcqSettings(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const totalQuestions = Number(formData.get("totalQuestions") || 10);
  const passingScore = Number(formData.get("passingScore") || 70);

  const mcq = await prisma.courseMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return;

  await prisma.courseMcq.update({
    where: { id: mcq.id },
    data: {
      title: title || mcq.title,
      totalQuestions: Number.isFinite(totalQuestions)
        ? Math.max(1, totalQuestions)
        : mcq.totalQuestions,
      passingScore: Number.isFinite(passingScore)
        ? Math.max(0, Math.min(100, passingScore))
        : mcq.passingScore,
    },
  });

  revalidateCourseMcqPaths(mcq.programId, mcq.id);
}

export async function publishCourseMcqAction(formData: FormData) {
  await publishCourseMcq(formData);
}

export async function publishCourseMcq(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();

  const mcq = await prisma.courseMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "MCQ set not found." };

  const bank = parseMcqQuestions(mcq.questions);
  if (bank.length === 0) {
    return { error: "Add at least one question before publishing." };
  }

  await prisma.courseMcq.update({
    where: { id: mcq.id },
    data: {
      status: McqGenerationStatus.READY,
      generatedAt: new Date(),
      isActive: true,
    },
  });

  revalidateCourseMcqPaths(mcq.programId, mcq.id);
}

export async function importCourseMcqJsonAction(formData: FormData) {
  return importCourseMcqJson(formData);
}

export async function importCourseMcqJson(formData: FormData) {
  const session = await requireCapability("manageContent");
  const mcqId = String(formData.get("mcqId") || "").trim();
  const jsonText = String(formData.get("json") || "");
  const replace = formData.get("replace") === "on";

  const mcq = await prisma.courseMcq.findFirst({
    where: { id: mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "MCQ set not found." };

  const bank = parseMcqQuestions(mcq.questions);
  const result = importMcqQuestionsFromJson(jsonText, bank, { replace });
  if (!result.ok) return { error: result.error };

  const wasReady = mcq.status === McqGenerationStatus.READY;
  const { status, needsRepublish } = resolveMcqStatusAfterImport({
    wasReady,
    replace,
  });

  await prisma.courseMcq.update({
    where: { id: mcq.id },
    data: {
      questions: result.questions as unknown as McqQuestion[],
      status,
    },
  });

  revalidateCourseMcqPaths(mcq.programId, mcq.id);
  return {
    ok: true as const,
    imported: result.imported,
    skipped: result.skipped,
    total: result.questions.length,
    needsRepublish,
  };
}

async function programContext(programId: string, organizationId: string) {
  if (isCompassDatabase()) return null;
  return prisma.program.findFirst({
    where: { id: programId, organizationId },
    include: {
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                select: { title: true, summary: true },
              },
            },
          },
        },
      },
    },
  });
}

function outlineFromProgram(
  program: NonNullable<Awaited<ReturnType<typeof programContext>>>,
) {
  if (!program.syllabus) return null;
  return program.syllabus.modules
    .map((mod) => {
      const lessons = mod.lessons
        .map((lesson) =>
          lesson.summary
            ? `  - ${lesson.title}: ${lesson.summary}`
            : `  - ${lesson.title}`,
        )
        .join("\n");
      const header = mod.summary ? `${mod.title} — ${mod.summary}` : mod.title;
      return `${header}\n${lessons}`;
    })
    .join("\n\n");
}

async function generateBankForMcq(input: {
  organizationId: string;
  mcq: {
    id: string;
    programId: string;
    setNumber: number;
    title: string | null;
    totalQuestions: number;
  };
  program: NonNullable<Awaited<ReturnType<typeof programContext>>>;
  topic?: string;
  questionCount: number;
  difficulty: "intro" | "intermediate" | "advanced";
  focus: string;
  replace: boolean;
}) {
  const adapter = await getAiAdapterForOrg(input.organizationId);
  const setCount = COURSE_MCQ_SET_COUNT;
  const draft = await adapter.generateQuizDraft({
    programName: input.program.title,
    programSummary: input.program.description,
    syllabusOutline: outlineFromProgram(input.program),
    topic: topicForMcqSet({
      baseTopic: input.topic,
      programTitle: input.program.title,
      setNumber: input.mcq.setNumber || 1,
      setCount,
      focus: input.focus,
    }),
    questionCount: input.questionCount,
    difficulty: input.difficulty,
  });

  const generated = quizDraftToMcqQuestions(draft);
  if (generated.length === 0) {
    throw new Error("AI returned no valid questions.");
  }

  const existing = input.replace
    ? []
    : parseMcqQuestions(
        (
          await prisma.courseMcq.findUnique({
            where: { id: input.mcq.id },
            select: { questions: true },
          })
        )?.questions,
      );

  await prisma.courseMcq.update({
    where: { id: input.mcq.id },
    data: {
      title: input.mcq.title || draft.title,
      questions: [...existing, ...generated] as unknown as McqQuestion[],
      totalQuestions: Math.min(
        input.mcq.totalQuestions || input.questionCount,
        [...existing, ...generated].length,
      ),
      status: McqGenerationStatus.PENDING,
      source: McqSource.AI_GENERATED,
    },
  });

  return {
    provider: adapter.provider,
    imported: generated.length,
    total: existing.length + generated.length,
  };
}

/** Fill one course MCQ set using the org AI plugin (OptGPT / Ollama). */
export async function generateCourseMcqWithAi(input: {
  mcqId: string;
  topic?: string;
  questionCount?: number;
  difficulty?: "intro" | "intermediate" | "advanced";
  replace?: boolean;
}) {
  if (isCompassDatabase()) {
    return { error: "AI MCQ generation is not available on compass_dev." };
  }
  const session = await requireCapability("manageContent");
  const mcq = await prisma.courseMcq.findFirst({
    where: { id: input.mcqId, organizationId: session.user.organizationId },
  });
  if (!mcq) return { error: "MCQ set not found." };

  const program = await programContext(mcq.programId, session.user.organizationId);
  if (!program) return { error: "Program not found." };

  const questionCount = Math.min(Math.max(input.questionCount ?? 10, 3), 20);
  const profile =
    SET_AI_PROFILES[(mcq.setNumber || 1) - 1] ?? SET_AI_PROFILES[0]!;

  try {
    const result = await generateBankForMcq({
      organizationId: session.user.organizationId,
      mcq,
      program,
      topic: input.topic,
      questionCount,
      difficulty: input.difficulty ?? profile.difficulty,
      focus: profile.focus,
      replace: input.replace ?? true,
    });
    revalidateCourseMcqPaths(mcq.programId, mcq.id);
    return { ok: true as const, ...result };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI generation failed.",
    };
  }
}

/** Generate all 3 MCQ sets for a program with AI (unique focus per set). */
export async function generateProgramMcqSetsWithAi(input: {
  programId: string;
  title?: string;
  topic?: string;
  questionCount?: number;
  createMissingSets?: boolean;
}) {
  if (isCompassDatabase()) {
    return { error: "AI MCQ generation is not available on compass_dev." };
  }
  const session = await requireCapability("manageContent");
  const program = await programContext(
    input.programId,
    session.user.organizationId,
  );
  if (!program) return { error: "Program not found." };

  let sets = await prisma.courseMcq.findMany({
    where: {
      programId: program.id,
      organizationId: session.user.organizationId,
    },
    orderBy: [{ setNumber: "asc" }, { createdAt: "asc" }],
  });

  if (sets.length < COURSE_MCQ_SET_COUNT && input.createMissingSets !== false) {
    const baseTitle = input.title?.trim() || `${program.title} MCQ`;
    const existingNumbers = sets.map((row) => row.setNumber);
    const missing = allocateSetNumbers(existingNumbers, COURSE_MCQ_SET_COUNT).filter(
      (n) => !existingNumbers.includes(n),
    );
    const perAttempt = Math.min(Math.max(input.questionCount ?? 10, 3), 20);
    for (const setNumber of missing) {
      const created = await prisma.courseMcq.create({
        data: {
          organizationId: session.user.organizationId,
          programId: program.id,
          setNumber,
          title: titleForMcqSet(baseTitle, setNumber, COURSE_MCQ_SET_COUNT),
          questions: [],
          totalQuestions: perAttempt,
          passingScore: 70,
          status: McqGenerationStatus.PENDING,
          source: McqSource.AI_GENERATED,
          isActive: true,
        },
      });
      sets.push(created);
    }
    sets.sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));
  }

  const targets = sets.slice(0, COURSE_MCQ_SET_COUNT);
  if (targets.length === 0) {
    return { error: "No MCQ sets found for this program." };
  }

  const questionCount = Math.min(Math.max(input.questionCount ?? 10, 3), 20);
  const results: Array<{ setNumber: number; imported: number; total: number }> =
    [];

  try {
    for (let index = 0; index < targets.length; index += 1) {
      const mcq = targets[index]!;
      const profile = SET_AI_PROFILES[index] ?? SET_AI_PROFILES[0]!;
      const result = await generateBankForMcq({
        organizationId: session.user.organizationId,
        mcq,
        program,
        topic: input.topic,
        questionCount,
        difficulty: profile.difficulty,
        focus: profile.focus,
        replace: true,
      });
      results.push({
        setNumber: mcq.setNumber || index + 1,
        imported: result.imported,
        total: result.total,
      });
      revalidateCourseMcqPaths(program.id, mcq.id);
    }

    const adapter = await getAiAdapterForOrg(session.user.organizationId);
    return {
      ok: true as const,
      provider: adapter.provider,
      sets: results,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI generation failed.",
    };
  }
}
