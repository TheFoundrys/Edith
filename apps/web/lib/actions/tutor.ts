"use server";

import { getAiAdapterForOrg } from "@/lib/ai";
import type { AiTutorMessage } from "@/lib/ai/types";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadCourseLessonContext } from "@/lib/learning/course-context";

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LEN = 2000;
const MAX_LESSON_EXCERPT = 4000;

export async function askLessonTutor(input: {
  courseId: string;
  lessonId: string;
  messages: AiTutorMessage[];
}) {
  const session = await requireStudent();

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      programId: input.courseId,
      userId: session.user.id,
      status: "ACTIVE",
      organizationId: session.user.organizationId,
    },
  });
  if (!enrollment) return { error: "You are not enrolled in this course." };

  const ctx = await loadCourseLessonContext({
    programId: input.courseId,
    lessonId: input.lessonId,
    organizationId: session.user.organizationId,
  });
  if (!ctx?.lesson) return { error: "Lesson not found in the published syllabus." };

  const messages = (input.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, MAX_MESSAGE_LEN),
    }));

  if (!messages.length || messages[messages.length - 1]?.role !== "user") {
    return { error: "Send a question to the tutor." };
  }

  const excerpt =
    ctx.lesson.contentType === "RICH_TEXT"
      ? ctx.lesson.contentBody.slice(0, MAX_LESSON_EXCERPT)
      : [
          ctx.lesson.summary,
          `Content type: ${ctx.lesson.contentType}`,
          ctx.lesson.contentBody.slice(0, 500),
        ]
          .filter(Boolean)
          .join("\n");

  try {
    const adapter = await getAiAdapterForOrg(session.user.organizationId);
    const { reply } = await adapter.tutorReply({
      programName: ctx.programName,
      programSummary: ctx.programSummary,
      syllabusOutline: ctx.syllabusOutline,
      moduleTitle: ctx.lesson.moduleTitle,
      moduleSummary: ctx.lesson.moduleSummary,
      lessonTitle: ctx.lesson.title,
      lessonSummary: ctx.lesson.summary,
      lessonContentType: ctx.lesson.contentType,
      lessonContentExcerpt: excerpt,
      messages,
    });
    return {
      ok: true as const,
      provider: adapter.provider,
      reply,
      course: {
        name: ctx.programName,
        summary: ctx.programSummary,
        moduleTitle: ctx.lesson.moduleTitle,
        lessonTitle: ctx.lesson.title,
      },
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Tutor reply failed.",
    };
  }
}
