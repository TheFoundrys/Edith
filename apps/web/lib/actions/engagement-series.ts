"use server";

import { revalidatePath } from "next/cache";
import { McqGenerationStatus, McqSource } from "@prisma/client";
import { getAiAdapterForOrg } from "@/lib/ai";
import { generateMcqQuestionsWithAi } from "@/lib/assessments/mcq-ai-generate";
import { addDays, moduleOutline, programOutline } from "@/lib/assessments/syllabus-outline";
import { generateProgramMcqSetsWithAi } from "@/lib/actions/admin-course-mcq";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  parseMcqQuestions,
  type McqQuestion,
} from "@/lib/assessments/mcq-types";

function revalidateEngagementPaths(programId: string) {
  revalidatePath(`/admin/syllabus/${programId}`);
  revalidatePath("/admin/syllabus");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/quizzes");
  revalidatePath("/admin/lesson-mcqs");
  revalidatePath("/admin/course-mcqs");
  revalidatePath("/student/assessments");
  revalidatePath("/student/assignments");
  revalidatePath("/student/quizzes");
  revalidatePath("/student/dashboard");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath(`/student/learning/${programId}`);
}

async function loadProgram(programId: string, organizationId: string) {
  return prisma.program.findFirst({
    where: { id: programId, organizationId },
    include: {
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  isPublished: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

type OutlineLesson = {
  id: string;
  title: string;
  summary: string | null;
  isPublished: boolean;
};

function lessonsForModule(lessons: OutlineLesson[]): OutlineLesson[] {
  const published = lessons.filter((lesson) => lesson.isPublished);
  return published.length > 0 ? published : lessons;
}

/** AI-generate weekly assignments, module quizzes, lesson MCQs, and course MCQ banks. */
export async function generateEngagementSeriesWithAi(input: {
  programId: string;
  daysBetweenAssignments?: number;
  questionsPerModuleQuiz?: number;
  questionsPerLessonMcq?: number;
  skipExisting?: boolean;
  includeCourseMcq?: boolean;
  publish?: boolean;
}) {
  if (isCompassDatabase()) {
    return { error: "Engagement series is not available on compass_dev." };
  }

  const session = await requireCapability("manageContent");
  const program = await loadProgram(input.programId, session.user.organizationId);
  if (!program?.syllabus) {
    return { error: "Publish a syllabus with modules before generating engagement content." };
  }

  const daysBetween = Math.max(1, input.daysBetweenAssignments ?? 7);
  const moduleQuizCount = Math.min(Math.max(input.questionsPerModuleQuiz ?? 5, 3), 15);
  const lessonMcqCount = Math.min(Math.max(input.questionsPerLessonMcq ?? 4, 3), 10);
  const skipExisting = input.skipExisting !== false;
  const publish = input.publish !== false;
  const includeCourseMcq = input.includeCourseMcq !== false;

  const modules = program.syllabus.modules;
  const fullOutline = programOutline(
    modules.map((mod) => ({
      title: mod.title,
      summary: mod.summary,
      lessons: lessonsForModule(mod.lessons),
    })),
  );

  const [existingAssignments, existingQuizzes, existingLessonMcqs, existingCourseMcqs] =
    await Promise.all([
      prisma.assignment.findMany({
        where: { programId: program.id, organizationId: session.user.organizationId },
        select: { title: true },
      }),
      prisma.quiz.findMany({
        where: { programId: program.id, organizationId: session.user.organizationId },
        select: { title: true },
      }),
      prisma.lessonMcq.findMany({
        where: { programId: program.id, organizationId: session.user.organizationId },
        select: { lessonId: true, questions: true },
      }),
      prisma.courseMcq.findMany({
        where: { programId: program.id, organizationId: session.user.organizationId },
        select: { id: true, status: true, questions: true },
      }),
    ]);

  const assignmentTitles = new Set(existingAssignments.map((row) => row.title));
  const quizTitles = new Set(existingQuizzes.map((row) => row.title));
  const lessonMcqBankSize = new Map(
    existingLessonMcqs.map((row) => [
      row.lessonId,
      parseMcqQuestions(row.questions).length,
    ]),
  );

  const adapter = await getAiAdapterForOrg(session.user.organizationId);
  const startDate = new Date();
  const errors: string[] = [];
  let assignmentsCreated = 0;
  let quizzesCreated = 0;
  let lessonMcqsCreated = 0;

  for (let index = 0; index < modules.length; index += 1) {
    const mod = modules[index]!;
    const moduleLessons = lessonsForModule(mod.lessons);
    const modOutline = moduleOutline({
      title: mod.title,
      summary: mod.summary,
      lessons: moduleLessons,
    });
    const assignmentTitle = `${mod.title} — Weekly reflection`;
    const quizTitle = `${mod.title} — Check-in quiz`;

    if (!skipExisting || !assignmentTitles.has(assignmentTitle)) {
      try {
        const draft = await adapter.generateAssignmentDraft({
          programName: program.title,
          programSummary: program.description,
          syllabusOutline: modOutline,
          topic: `${mod.title} — apply concepts from this module in a short written reflection`,
          difficulty:
            index === 0 ? "intro" : index === modules.length - 1 ? "advanced" : "intermediate",
        });
        await prisma.assignment.create({
          data: {
            organizationId: session.user.organizationId,
            programId: program.id,
            title: assignmentTitle,
            description: draft.description,
            dueAt: addDays(startDate, (index + 1) * daysBetween),
            isPublished: publish,
          },
        });
        assignmentsCreated += 1;
        assignmentTitles.add(assignmentTitle);
      } catch (err) {
        errors.push(
          `Assignment "${mod.title}": ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }

    if (!skipExisting || !quizTitles.has(quizTitle)) {
      try {
        const generated = await generateMcqQuestionsWithAi({
          organizationId: session.user.organizationId,
          programName: program.title,
          programSummary: program.description,
          syllabusOutline: modOutline,
          topic: `${mod.title} — module check-in quiz`,
          questionCount: moduleQuizCount,
          difficulty:
            index === 0 ? "intro" : index === modules.length - 1 ? "advanced" : "intermediate",
        });
        await prisma.quiz.create({
          data: {
            organizationId: session.user.organizationId,
            programId: program.id,
            title: quizTitle,
            description: generated.description || `Quick check-in for ${mod.title}.`,
            status: publish ? "PUBLISHED" : "DRAFT",
            questions: {
              create: generated.questions.map((question, qIndex) => ({
                prompt: question.prompt,
                optionsJson: JSON.stringify(question.options),
                correctIndex: question.correctIndex,
                sortOrder: qIndex,
              })),
            },
          },
        });
        quizzesCreated += 1;
        quizTitles.add(quizTitle);
      } catch (err) {
        errors.push(
          `Quiz "${mod.title}": ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }

    for (const lesson of moduleLessons) {
      const bankSize = lessonMcqBankSize.get(lesson.id) ?? 0;
      if (skipExisting && bankSize > 0) continue;

      try {
        let mcq = await prisma.lessonMcq.findFirst({
          where: { lessonId: lesson.id, programId: program.id },
        });
        if (!mcq) {
          mcq = await prisma.lessonMcq.create({
            data: {
              organizationId: session.user.organizationId,
              lessonId: lesson.id,
              programId: program.id,
              questions: [],
              passingScore: 70,
              status: McqGenerationStatus.PENDING,
              source: McqSource.AI_GENERATED,
              isActive: true,
            },
          });
          lessonMcqsCreated += 1;
        }

        const generated = await generateMcqQuestionsWithAi({
          organizationId: session.user.organizationId,
          programName: program.title,
          programSummary: program.description,
          syllabusOutline: fullOutline,
          topic: `${lesson.title} — lesson quiz after watching/reading this lesson`,
          questionCount: lessonMcqCount,
          difficulty: "intro",
        });

        await prisma.lessonMcq.update({
          where: { id: mcq.id },
          data: {
            questions: generated.questions as unknown as McqQuestion[],
            status: publish ? McqGenerationStatus.READY : McqGenerationStatus.PENDING,
            source: McqSource.AI_GENERATED,
            isActive: true,
          },
        });
        lessonMcqBankSize.set(lesson.id, generated.questions.length);
      } catch (err) {
        errors.push(
          `Lesson quiz "${lesson.title}": ${err instanceof Error ? err.message : "failed"}`,
        );
      }
    }
  }

  let courseMcqSets = 0;
  if (includeCourseMcq) {
    const hasReadyBank = existingCourseMcqs.some((row) => row.status === "READY");
    if (!skipExisting || !hasReadyBank) {
      const result = await generateProgramMcqSetsWithAi({
        programId: program.id,
        questionCount: 10,
        createMissingSets: true,
      });
      if ("error" in result && result.error) {
        errors.push(`Course MCQ banks: ${result.error}`);
      } else if ("sets" in result && result.sets) {
        courseMcqSets = result.sets.length;
        if (publish) {
          const mcqs = await prisma.courseMcq.findMany({
            where: { programId: program.id, organizationId: session.user.organizationId },
          });
          for (const mcq of mcqs) {
            const bank = Array.isArray(mcq.questions) ? mcq.questions.length : 0;
            if (bank > 0) {
              await prisma.courseMcq.update({
                where: { id: mcq.id },
                data: { status: McqGenerationStatus.READY, isActive: true },
              });
            }
          }
        }
      }
    }
  }

  revalidateEngagementPaths(program.id);

  return {
    ok: true as const,
    provider: adapter.provider,
    assignmentsCreated,
    quizzesCreated,
    lessonMcqsCreated,
    courseMcqSets,
    moduleCount: modules.length,
    errors,
  };
}
