"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAssignment } from "@/lib/actions/assignments-admin";
import { createCourseMcqSet } from "@/lib/actions/admin-course-mcq";
import { createLessonMcqSet } from "@/lib/actions/admin-lesson-mcq";

function revalidateSyllabusContent(programId: string) {
  revalidatePath(`/admin/syllabus/${programId}`);
  revalidatePath("/admin/syllabus");
}

export async function createAssignmentFromSyllabusAction(formData: FormData) {
  const programId = String(formData.get("programId") || "").trim();
  const result = await createAssignment(formData);
  if ("error" in result && result.error) return result;
  if (programId) revalidateSyllabusContent(programId);
  if ("id" in result && result.id) {
    redirect(`/admin/assignments/${result.id}`);
  }
  return result;
}

export async function createCourseMcqFromSyllabusAction(formData: FormData) {
  const programId = String(formData.get("programId") || "").trim();
  const result = await createCourseMcqSet(formData);
  if (result && "error" in result && result.error) return result;
  if (programId) revalidateSyllabusContent(programId);
}

export async function createLessonMcqFromSyllabusAction(formData: FormData) {
  const programId = String(formData.get("programId") || "").trim();
  const result = await createLessonMcqSet(formData);
  if (result && "error" in result && result.error) return result;
  if (programId) revalidateSyllabusContent(programId);
}
