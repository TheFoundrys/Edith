"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAiAdapterForOrg } from "@/lib/ai";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

async function programContext(programId: string, organizationId: string) {
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

export async function listProgramsForStaff() {
  const session = await requireCapability("manageContent");
  return prisma.program.findMany({
    where: { organizationId: session.user.organizationId },
    select: { id: true, title: true, slug: true, status: true },
    orderBy: { title: "asc" },
  });
}

export async function createAssignment(formData: FormData) {
  const session = await requireCapability("manageContent");
  const parsed = z
    .object({
      programId: z.string().min(1),
      title: z.string().min(2).max(160),
      description: z.string().max(8000).optional(),
      dueAt: z.string().optional(),
      isPublished: z.string().optional(),
    })
    .safeParse({
      programId: formData.get("programId"),
      title: formData.get("title"),
      description: formData.get("description"),
      dueAt: formData.get("dueAt"),
      isPublished: formData.get("isPublished"),
    });
  if (!parsed.success) return { error: "Invalid assignment fields." };

  const program = await prisma.program.findFirst({
    where: {
      id: parsed.data.programId,
      organizationId: session.user.organizationId,
    },
  });
  if (!program) return { error: "Program not found." };

  const dueAt = parsed.data.dueAt
    ? new Date(parsed.data.dueAt)
    : null;

  const assignment = await prisma.assignment.create({
    data: {
      organizationId: session.user.organizationId,
      programId: program.id,
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
      isPublished: parsed.data.isPublished === "on" || parsed.data.isPublished === "true",
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath(`/admin/assignments/${assignment.id}`);
  revalidatePath("/student/assignments");
  return { ok: true as const, id: assignment.id };
}

export async function updateAssignment(assignmentId: string, formData: FormData) {
  const session = await requireCapability("manageContent");
  const existing = await prisma.assignment.findFirst({
    where: { id: assignmentId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Assignment not found." };

  const parsed = z
    .object({
      title: z.string().min(2).max(160),
      description: z.string().max(8000).optional(),
      dueAt: z.string().optional(),
      isPublished: z.string().optional(),
    })
    .safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      dueAt: formData.get("dueAt"),
      isPublished: formData.get("isPublished"),
    });
  if (!parsed.success) return { error: "Invalid assignment fields." };

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      title: parsed.data.title.trim(),
      description: parsed.data.description?.trim() || "",
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
      isPublished:
        parsed.data.isPublished === "on" || parsed.data.isPublished === "true",
    },
  });

  revalidatePath("/admin/assignments");
  revalidatePath(`/admin/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath(`/student/assignments/${assignmentId}`);
  return { ok: true as const };
}

export async function deleteAssignment(assignmentId: string) {
  const session = await requireCapability("manageContent");
  const existing = await prisma.assignment.findFirst({
    where: { id: assignmentId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Assignment not found." };
  await prisma.assignment.delete({ where: { id: assignmentId } });
  revalidatePath("/admin/assignments");
  revalidatePath("/student/assignments");
  return { ok: true as const };
}

export async function generateAssignmentDraft(input: {
  programId: string;
  topic?: string;
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
    const draft = await adapter.generateAssignmentDraft({
      programName: program.title,
      programSummary: program.description,
      syllabusOutline: outlineFromProgram(program),
      topic: input.topic,
      difficulty: input.difficulty,
    });
    return {
      ok: true as const,
      provider: adapter.provider,
      draft,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "AI draft failed.",
    };
  }
}
