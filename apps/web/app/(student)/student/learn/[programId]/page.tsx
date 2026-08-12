import { redirect } from "next/navigation";

export default async function StudentLearnProgramRedirect({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  redirect(`/student/learning/${programId}`);
}
