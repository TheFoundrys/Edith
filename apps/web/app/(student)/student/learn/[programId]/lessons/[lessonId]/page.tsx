import { redirect } from "next/navigation";

export default async function StudentLearnLessonRedirect({
  params,
}: {
  params: Promise<{ programId: string; lessonId: string }>;
}) {
  const { programId, lessonId } = await params;
  redirect(`/student/learning/${programId}/lessons/${lessonId}`);
}
