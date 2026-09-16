"use server";

import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function revalidateForumPaths(threadId: string, categoryId: string) {
  revalidatePath("/student/forums");
  revalidatePath(`/student/forums/${threadId}`);
  revalidatePath("/admin/forums");
  revalidatePath(`/admin/forums?category=${categoryId}`);
}

export async function createForumReplyAction(formData: FormData) {
  await createForumReply(formData);
}

export async function createForumReply(formData: FormData) {
  const session = await requireStudent();
  const threadId = String(formData.get("threadId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!threadId || !content) return { error: "Reply content is required." };

  const thread = await prisma.forumThread.findFirst({
    where: {
      id: threadId,
      category: { organizationId: session.user.organizationId },
    },
    select: { id: true, categoryId: true, isLocked: true },
  });
  if (!thread) return { error: "Thread not found." };
  if (thread.isLocked) return { error: "This thread is locked." };

  await prisma.$transaction([
    prisma.forumReply.create({
      data: {
        threadId: thread.id,
        authorId: session.user.id,
        content,
        parentReplyId: String(formData.get("parentReplyId") || "").trim() || null,
      },
    }),
    prisma.forumThread.update({
      where: { id: thread.id },
      data: { replyCount: { increment: 1 } },
    }),
  ]);

  revalidateForumPaths(thread.id, thread.categoryId);
  return { ok: true as const };
}

export async function incrementForumThreadViews(threadId: string) {
  const session = await requireStudent();
  const thread = await prisma.forumThread.findFirst({
    where: {
      id: threadId,
      category: { organizationId: session.user.organizationId },
    },
    select: { id: true },
  });
  if (!thread) return;
  await prisma.forumThread.update({
    where: { id: thread.id },
    data: { viewCount: { increment: 1 } },
  });
}
