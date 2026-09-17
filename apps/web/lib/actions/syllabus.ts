"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  LessonContentType,
  SyllabusStatus,
} from "@prisma/client";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import { findCompassActiveEnrollment } from "@/lib/compass/enrollment";
import {
  isCompassLessonComplete,
  loadCompassLesson,
  markCompassLessonComplete,
} from "@/lib/compass/syllabus";
import { getCompassCourseById } from "@/lib/compass/courses";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  extractYouTubeUrls,
  mergeLessonReadingAndVideo,
} from "@/lib/learning/youtube-content";
import { inferLessonContentType } from "@/lib/learning/video-embed";
import { parsePublishedFlag } from "@/lib/learning/outline";
import { saveLessonPdf, saveLessonVideo } from "@/lib/storage";

function revalidateSyllabus(
  programId: string,
  programSlug?: string | null,
  lessonId?: string,
) {
  revalidatePath("/admin/syllabus");
  revalidatePath(`/admin/syllabus/${programId}`);
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/admin/programs");
  revalidatePath("/courses");
  if (programSlug) {
    revalidatePath(`/courses/${programSlug}`);
  }
  revalidatePath("/student/learning");
  revalidatePath(`/student/learning/${programId}`);
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath("/student/dashboard");
  if (lessonId) {
    revalidatePath(`/student/learning/${programId}/lessons/${lessonId}`);
    revalidatePath(`/student/learn/${programId}/lessons/${lessonId}`);
  }
}

async function revalidateSyllabusForProgram(
  programId: string,
  lessonId?: string,
) {
  if (isCompassDatabase()) {
    const course = await getCompassCourseById(programId);
    revalidateSyllabus(programId, course?.slug, lessonId);
    return;
  }
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { slug: true },
  });
  revalidateSyllabus(programId, program?.slug, lessonId);
}

async function staffOwnedProgram(programId: string, organizationId: string) {
  if (isCompassDatabase()) return null;
  return prisma.program.findFirst({
    where: { id: programId, organizationId },
    include: { syllabus: true },
  });
}

const syllabusMetaSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
});

const moduleSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().nullable(),
});

const lessonSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().nullable(),
  contentType: z.nativeEnum(LessonContentType).optional(),
  contentBody: z.string().max(50000).optional().nullable(),
  durationMin: z.coerce.number().int().min(0).optional().nullable(),
  isPublished: z.boolean().optional(),
});

function resolvedContentType(
  rawType: unknown,
  contentBody: string | null | undefined,
  fallback?: LessonContentType,
) {
  const value = typeof rawType === "string" ? rawType.trim() : "";
  if (
    value &&
    (Object.values(LessonContentType) as string[]).includes(value)
  ) {
    return value as LessonContentType;
  }
  if (fallback) return fallback;
  return inferLessonContentType(contentBody ?? "") as LessonContentType;
}

function lessonVideoFile(formData: FormData) {
  const file = formData.get("video");
  return file instanceof File && file.size > 0 ? file : null;
}

async function lessonContentFromForm(
  contentType: LessonContentType,
  formData: FormData,
  existingContent: string,
): Promise<{ content: string } | { error: string }> {
  if (contentType === LessonContentType.PDF_FILE) {
    const file = formData.get("pdf");
    if (file instanceof File && file.size > 0) {
      const stored = await saveLessonPdf(file);
      if ("error" in stored) return { error: stored.error };
      return { content: stored.storagePath };
    }
    if (existingContent.trim()) return { content: existingContent };
    return { error: "Upload a PDF for this activity." };
  }

  const video = lessonVideoFile(formData);
  if (contentType === LessonContentType.VIDEO_URL && video) {
    const stored = await saveLessonVideo(video);
    if ("error" in stored) return { error: stored.error };
    return { content: stored.storagePath };
  }

  const pasted = String(formData.get("contentBody") ?? "").trim();
  if (contentType === LessonContentType.RICH_TEXT) {
    const videoField = formData.get("videoUrl");
    const videoUrl =
      videoField === null
        ? (extractYouTubeUrls(existingContent)[0] ?? "")
        : String(videoField).trim();
    const content = mergeLessonReadingAndVideo(pasted, videoUrl);
    if (content) return { content };
    if (existingContent.trim()) return { content: existingContent };
    return { content: "" };
  }

  if (pasted) return { content: pasted };
  if (existingContent.trim()) return { content: existingContent };
  if (contentType === LessonContentType.VIDEO_URL) {
    return { error: "Paste a video URL or upload a video file." };
  }
  return { content: "" };
}

export async function upsertSyllabus(programId: string, formData: FormData) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program) return { error: "Program not found." };

  const parsed = syllabusMetaSchema.safeParse({
    title: formData.get("title") || null,
    description: formData.get("description") || null,
  });
  if (!parsed.success) return { error: "Invalid syllabus details." };

  const title =
    parsed.data.title?.trim() ||
    program.syllabus?.title ||
    `${program.title} Syllabus`;

  await prisma.programSyllabus.upsert({
    where: { programId },
    create: {
      programId,
      title,
      description: parsed.data.description?.trim() || null,
      status: SyllabusStatus.DRAFT,
    },
    update: {
      title,
      description: parsed.data.description?.trim() || null,
    },
  });

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function setSyllabusStatus(
  programId: string,
  status: SyllabusStatus,
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Create a syllabus first." };

  if (status === SyllabusStatus.PUBLISHED) {
    const modules = await prisma.syllabusModule.count({
      where: { syllabusId: program.syllabus.id },
    });
    if (modules === 0) {
      return { error: "Add at least one section before publishing." };
    }
    const publishedActivities = await prisma.syllabusLesson.count({
      where: {
        isPublished: true,
        module: { syllabusId: program.syllabus.id },
      },
    });
    if (publishedActivities === 0) {
      return {
        error: "Add at least one visible activity before publishing.",
      };
    }
  }

  await prisma.programSyllabus.update({
    where: { id: program.syllabus.id },
    data: { status },
  });

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function createModule(programId: string, formData: FormData) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program) return { error: "Program not found." };

  const parsed = moduleSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || null,
  });
  if (!parsed.success) return { error: "Module title is required." };

  let syllabusId = program.syllabus?.id;
  if (!syllabusId) {
    const created = await prisma.programSyllabus.create({
      data: {
        programId,
        title: `${program.title} Syllabus`,
        status: SyllabusStatus.DRAFT,
      },
    });
    syllabusId = created.id;
  }

  const maxOrder = await prisma.syllabusModule.aggregate({
    where: { syllabusId },
    _max: { order: true },
  });

  await prisma.syllabusModule.create({
    data: {
      syllabusId,
      title: parsed.data.title.trim(),
      summary: parsed.data.summary?.trim() || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function updateModule(
  programId: string,
  moduleId: string,
  formData: FormData,
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const mod = await prisma.syllabusModule.findFirst({
    where: { id: moduleId, syllabusId: program.syllabus.id },
  });
  if (!mod) return { error: "Module not found." };

  const parsed = moduleSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || null,
  });
  if (!parsed.success) return { error: "Module title is required." };

  await prisma.syllabusModule.update({
    where: { id: moduleId },
    data: {
      title: parsed.data.title.trim(),
      summary: parsed.data.summary?.trim() || null,
    },
  });

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function deleteModule(programId: string, moduleId: string) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const mod = await prisma.syllabusModule.findFirst({
    where: { id: moduleId, syllabusId: program.syllabus.id },
  });
  if (!mod) return { error: "Module not found." };

  await prisma.syllabusModule.delete({ where: { id: moduleId } });
  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function moveModule(
  programId: string,
  moduleId: string,
  direction: "up" | "down",
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const modules = await prisma.syllabusModule.findMany({
    where: { syllabusId: program.syllabus.id },
    orderBy: { order: "asc" },
  });
  const index = modules.findIndex((m) => m.id === moduleId);
  if (index < 0) return { error: "Module not found." };
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= modules.length) return { ok: true as const };

  const a = modules[index];
  const b = modules[swapWith];
  await prisma.$transaction([
    prisma.syllabusModule.update({
      where: { id: a.id },
      data: { order: b.order },
    }),
    prisma.syllabusModule.update({
      where: { id: b.id },
      data: { order: a.order },
    }),
  ]);

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function createLesson(
  programId: string,
  moduleId: string,
  formData: FormData,
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const mod = await prisma.syllabusModule.findFirst({
    where: { id: moduleId, syllabusId: program.syllabus.id },
  });
  if (!mod) return { error: "Module not found." };

  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || null,
    contentType: formData.get("contentType") || undefined,
    contentBody: formData.get("contentBody") || "",
    durationMin: formData.get("durationMin") || null,
    isPublished: parsePublishedFlag(formData),
  });
  if (!parsed.success) return { error: "Invalid lesson details." };

  const contentType = lessonVideoFile(formData)
    ? LessonContentType.VIDEO_URL
    : resolvedContentType(
        parsed.data.contentType,
        parsed.data.contentBody,
      );
  const body = await lessonContentFromForm(
    contentType,
    formData,
    "",
  );
  if ("error" in body) return { error: body.error };

  const maxOrder = await prisma.syllabusLesson.aggregate({
    where: { moduleId },
    _max: { order: true },
  });

  const created = await prisma.syllabusLesson.create({
    data: {
      moduleId,
      title: parsed.data.title.trim(),
      summary: parsed.data.summary?.trim() || null,
      contentType,
      content: body.content,
      durationMin: parsed.data.durationMin ?? null,
      isPublished: parsed.data.isPublished ?? true,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateSyllabusForProgram(programId, created.id);
  return { ok: true as const };
}

export async function updateLesson(
  programId: string,
  lessonId: string,
  formData: FormData,
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      module: { syllabusId: program.syllabus.id },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  const parsed = lessonSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || null,
    contentType: formData.get("contentType") || undefined,
    contentBody: formData.get("contentBody") ?? lesson.content,
    durationMin: formData.get("durationMin") || null,
    isPublished: parsePublishedFlag(formData),
  });
  if (!parsed.success) return { error: "Invalid lesson details." };

  const contentType = lessonVideoFile(formData)
    ? LessonContentType.VIDEO_URL
    : resolvedContentType(
        parsed.data.contentType,
        parsed.data.contentBody,
        lesson.contentType,
      );
  const body = await lessonContentFromForm(
    contentType,
    formData,
    lesson.content,
  );
  if ("error" in body) return { error: body.error };

  await prisma.syllabusLesson.update({
    where: { id: lessonId },
    data: {
      title: parsed.data.title.trim(),
      summary: parsed.data.summary?.trim() || null,
      contentType,
      content: body.content,
      durationMin: parsed.data.durationMin ?? null,
      isPublished: parsed.data.isPublished ?? true,
    },
  });

  revalidateSyllabusForProgram(programId, lessonId);
  return { ok: true as const };
}

export async function deleteLesson(programId: string, lessonId: string) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      module: { syllabusId: program.syllabus.id },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  await prisma.syllabusLesson.delete({ where: { id: lessonId } });
  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

export async function moveLesson(
  programId: string,
  lessonId: string,
  direction: "up" | "down",
) {
  const session = await requireCapability("manageContent");
  const program = await staffOwnedProgram(
    programId,
    session.user.organizationId,
  );
  if (!program?.syllabus) return { error: "Syllabus not found." };

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      module: { syllabusId: program.syllabus.id },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  const lessons = await prisma.syllabusLesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
  });
  const index = lessons.findIndex((l) => l.id === lessonId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= lessons.length) return { ok: true as const };

  const a = lessons[index];
  const b = lessons[swapWith];
  await prisma.$transaction([
    prisma.syllabusLesson.update({
      where: { id: a.id },
      data: { order: b.order },
    }),
    prisma.syllabusLesson.update({
      where: { id: b.id },
      data: { order: a.order },
    }),
  ]);

  revalidateSyllabusForProgram(programId);
  return { ok: true as const };
}

async function requireEnrolledLearningAccess(programId: string, userId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      programId,
      userId,
      status: "ACTIVE",
    },
  });
  if (!enrollment) return null;

  const syllabus = await prisma.programSyllabus.findFirst({
    where: {
      programId,
      status: SyllabusStatus.PUBLISHED,
    },
    include: {
      program: { select: { id: true, title: true, slug: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!syllabus) return null;
  return { enrollment, syllabus };
}

export async function toggleLessonComplete(lessonId: string) {
  return setLessonCompleted(lessonId, "toggle");
}

/** Video activities call this when playback finishes. Never un-completes. */
export async function markLessonComplete(lessonId: string) {
  return setLessonCompleted(lessonId, true);
}

async function setLessonCompleted(lessonId: string, complete: true | "toggle") {
  const session = await requireStudent();

  if (isCompassDatabase()) {
    const courseRows = await prisma.$queryRaw<{ courseId: string }[]>`
      SELECT "courseId" FROM "Lesson" WHERE id = ${lessonId} LIMIT 1
    `;
    const courseId = courseRows[0]?.courseId;
    if (!courseId) return { error: "Lesson not found." };

    const enrollment = await findCompassActiveEnrollment(session.user.id, courseId);
    if (!enrollment) {
      return { error: "You must be enrolled in this program to track progress." };
    }

    const lesson = await loadCompassLesson(courseId, lessonId);
    if (!lesson) return { error: "Lesson not found." };

    const alreadyComplete = await isCompassLessonComplete(
      session.user.id,
      courseId,
      lessonId,
    );
    const shouldComplete = complete === true ? true : !alreadyComplete;
    if (shouldComplete && alreadyComplete) return { ok: true as const };

    if (!shouldComplete) {
      return { error: "Un-completing lessons is not supported on compass_dev." };
    }

    await markCompassLessonComplete(session.user.id, courseId, lessonId);
    revalidatePath("/student/learning");
    revalidatePath(`/student/learning/${courseId}`);
    revalidatePath(`/student/learning/${courseId}/lessons/${lessonId}`);
    revalidatePath("/student/my-courses");
    revalidatePath(`/student/my-courses/${courseId}`);
    revalidatePath("/student/dashboard");
    revalidatePath("/student/progress");
    return { ok: true as const };
  }

  const lesson = await prisma.syllabusLesson.findFirst({
    where: {
      id: lessonId,
      isPublished: true,
      module: { syllabus: { status: SyllabusStatus.PUBLISHED } },
    },
    include: {
      module: { include: { syllabus: true } },
    },
  });
  if (!lesson) return { error: "Lesson not found." };

  const access = await requireEnrolledLearningAccess(
    lesson.module.syllabus.programId,
    session.user.id,
  );
  if (!access) {
    return { error: "You must be enrolled in this program to track progress." };
  }

  const existing = await prisma.lessonProgress.findUnique({
    where: {
      lessonId_userId: { lessonId, userId: session.user.id },
    },
  });

  const alreadyComplete = Boolean(existing?.completedAt);
  const shouldComplete = complete === true ? true : !alreadyComplete;

  if (shouldComplete && alreadyComplete) {
    return { ok: true as const };
  }

  let markedComplete = false;
  if (!shouldComplete) {
    if (existing) {
      await prisma.lessonProgress.update({
        where: { id: existing.id },
        data: { completedAt: null },
      });
    }
  } else if (existing) {
    await prisma.lessonProgress.update({
      where: { id: existing.id },
      data: { completedAt: new Date() },
    });
    markedComplete = true;
  } else {
    await prisma.lessonProgress.create({
      data: {
        lessonId,
        userId: session.user.id,
        completedAt: new Date(),
      },
    });
    markedComplete = true;
  }

  const programId = lesson.module.syllabus.programId;
  if (markedComplete) {
    const { maybeIssueCertificate } = await import("@/lib/actions/learning-extras");
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { title: true, organizationId: true },
    });
    if (program) {
      await maybeIssueCertificate({
        userId: session.user.id,
        programId,
        organizationId: program.organizationId,
        programName: program.title,
      });
    }
  }

  revalidatePath("/student/learning");
  revalidatePath(`/student/learning/${programId}`);
  revalidatePath(`/student/learning/${programId}/lessons/${lessonId}`);
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/my-courses/${programId}`);
  revalidatePath("/student/dashboard");
  revalidatePath("/student/progress");
  revalidatePath("/student/certificates");
  return { ok: true as const };
}
