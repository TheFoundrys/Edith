"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function submitAssignment(
  assignmentId: string,
  contentBody: string,
) {
  const session = await requireStudent();
  const body = contentBody.trim();
  if (body.length < 10) {
    return { error: "Submission must be at least 10 characters." };
  }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, isPublished: true },
  });
  if (!assignment) return { error: "Assignment not found." };

  const enrolled = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      programId: assignment.programId,
      status: "ACTIVE",
    },
  });
  if (!enrolled) {
    return { error: "You must be enrolled in this course to submit." };
  }

  const existing = await prisma.assignmentSubmission.findFirst({
    where: {
      assignmentId,
      userId: session.user.id,
    },
  });
  if (existing?.status === "SUBMITTED") {
    return {
      error:
        "This assignment is already submitted and locked. You cannot change it.",
    };
  }

  if (existing) {
    await prisma.assignmentSubmission.update({
      where: { id: existing.id },
      data: {
        contentBody: body,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  } else {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        userId: session.user.id,
        contentBody: body,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      title: "Assignment submitted",
      body: `Your submission for “${assignment.title}” was received.`,
      href: `/student/assignments/${assignment.id}`,
    },
  });

  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/submissions");
  revalidatePath("/student/notifications");
  return { ok: true as const, locked: true as const };
}

export async function markNotificationRead(notificationId: string) {
  const session = await requireStudent();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/student/notifications");
  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const session = await requireStudent();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/student/notifications");
  return { ok: true as const };
}

/** Issue a completion certificate when all published lessons are done. */
export async function maybeIssueCertificate(opts: {
  userId: string;
  programId: string;
  organizationId: string;
  programName: string;
}) {
  const syllabus = await prisma.programSyllabus.findFirst({
    where: { programId: opts.programId, status: "PUBLISHED" },
    include: {
      modules: {
        include: {
          lessons: { where: { isPublished: true }, select: { id: true } },
        },
      },
    },
  });
  if (!syllabus) return;

  const lessonIds = syllabus.modules.flatMap((m) => m.lessons.map((l) => l.id));
  if (lessonIds.length === 0) return;

  const completed = await prisma.lessonProgress.count({
    where: {
      userId: opts.userId,
      lessonId: { in: lessonIds },
      completedAt: { not: null },
    },
  });
  if (completed < lessonIds.length) return;

  const existing = await prisma.certificate.findUnique({
    where: {
      programId_userId: { programId: opts.programId, userId: opts.userId },
    },
  });
  if (existing) return;

  const code = `FX-${opts.programId.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const certificate = await prisma.certificate.create({
    data: {
      organizationId: opts.organizationId,
      programId: opts.programId,
      userId: opts.userId,
      title: `Certificate of Completion — ${opts.programName}`,
      certificateCode: code,
    },
  });

  await prisma.notification.create({
    data: {
      userId: opts.userId,
      title: "Certificate earned",
      body: `You’ve completed ${opts.programName}.`,
      href: `/student/certificates/${certificate.id}`,
    },
  });

  revalidatePath("/student/certificates");
  revalidatePath(`/student/certificates/${certificate.id}`);
  revalidatePath("/student/notifications");
}
