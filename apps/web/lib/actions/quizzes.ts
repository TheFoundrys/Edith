"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAiAdapterForOrg } from "@/lib/ai";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

async function programContext(programId: string, organizationId: string) {
  return prisma.program.findFirst({
    where: { id: programId, organizationId },
    include: {
      syllabus: {
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: { title: true },
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
  if (!program.syllabus || program.syllabus.status !== "PUBLISHED") return null;
  return program.syllabus.modules
    .map((m) => {
      const lessons = m.lessons.map((l) => `  - ${l.title}`).join("\n");
      return `${m.title}\n${lessons}`;
    })
    .join("\n");
}

const questionSchema = z.object({
  prompt: z.string().min(2),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});

export async function createQuiz(input: {
  programId: string;
  title: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED";
  questions: z.infer<typeof questionSchema>[];
}) {
  const session = await requireCapability("manageContent");
  const program = await prisma.program.findFirst({
    where: {
      id: input.programId,
      organizationId: session.user.organizationId,
    },
  });
  if (!program) return { error: "Program not found." };

  const questions = z.array(questionSchema).min(1).safeParse(input.questions);
  if (!questions.success) return { error: "Add at least one valid question." };

  for (const q of questions.data) {
    if (q.correctIndex >= q.options.length) {
      return { error: "correctIndex out of range for a question." };
    }
  }

  const quiz = await prisma.quiz.create({
    data: {
      organizationId: session.user.organizationId,
      programId: program.id,
      title: input.title.trim(),
      description: input.description?.trim() || "",
      status: input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      questions: {
        create: questions.data.map((q, index) => ({
          prompt: q.prompt.trim(),
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          explanation: q.explanation?.trim() || null,
          sortOrder: index,
        })),
      },
    },
  });

  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quiz.id}`);
  revalidatePath("/student/quizzes");
  return { ok: true as const, id: quiz.id };
}

export async function updateQuiz(
  quizId: string,
  input: {
    title: string;
    description?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    questions: z.infer<typeof questionSchema>[];
  },
) {
  const session = await requireCapability("manageContent");
  const existing = await prisma.quiz.findFirst({
    where: { id: quizId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Quiz not found." };

  const questions = z.array(questionSchema).min(1).safeParse(input.questions);
  if (!questions.success) return { error: "Add at least one valid question." };

  await prisma.$transaction(async (tx) => {
    await tx.quizQuestion.deleteMany({ where: { quizId } });
    await tx.quiz.update({
      where: { id: quizId },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || "",
        status: input.status ?? existing.status,
        questions: {
          create: questions.data.map((q, index) => ({
            prompt: q.prompt.trim(),
            optionsJson: JSON.stringify(q.options),
            correctIndex: q.correctIndex,
            explanation: q.explanation?.trim() || null,
            sortOrder: index,
          })),
        },
      },
    });
  });

  revalidatePath("/admin/quizzes");
  revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${quizId}`);
  return { ok: true as const };
}

export async function deleteQuiz(quizId: string) {
  const session = await requireCapability("manageContent");
  const existing = await prisma.quiz.findFirst({
    where: { id: quizId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Quiz not found." };
  await prisma.quiz.delete({ where: { id: quizId } });
  revalidatePath("/admin/quizzes");
  revalidatePath("/student/quizzes");
  return { ok: true as const };
}

export async function generateQuizDraft(input: {
  programId: string;
  topic?: string;
  questionCount?: number;
  difficulty?: "intro" | "intermediate" | "advanced";
}) {
  const session = await requireCapability("manageContent");
  const program = await programContext(
    input.programId,
    session.user.organizationId,
  );
  if (!program) return { error: "Program not found." };

  try {
    const adapter = await getAiAdapterForOrg(session.user.organizationId);
    const draft = await adapter.generateQuizDraft({
      programName: program.name,
      programSummary: program.summary,
      syllabusOutline: outlineFromProgram(program),
      topic: input.topic,
      questionCount: input.questionCount,
      difficulty: input.difficulty,
    });
    return { ok: true as const, provider: adapter.provider, draft };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI draft failed.",
    };
  }
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, number>,
) {
  const session = await requireStudent();
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, status: "PUBLISHED" },
    include: {
      questions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quiz) return { error: "Quiz not found." };

  const enrolled = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: quiz.programId,
      status: "ACTIVE",
    },
  });
  if (!enrolled) return { error: "You must be enrolled to take this quiz." };

  let score = 0;
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctIndex) score += 1;
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
      answersJson: JSON.stringify(answers),
      score,
      maxScore: quiz.questions.length,
    },
  });

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Quiz submitted",
      body: `You scored ${score}/${quiz.questions.length} on “${quiz.title}”.`,
      href: `/student/quizzes/${quiz.id}`,
    },
  });

  revalidatePath(`/student/quizzes/${quizId}`);
  revalidatePath("/student/quizzes");
  revalidatePath("/student/notifications");
  return {
    ok: true as const,
    attemptId: attempt.id,
    score,
    maxScore: quiz.questions.length,
  };
}
