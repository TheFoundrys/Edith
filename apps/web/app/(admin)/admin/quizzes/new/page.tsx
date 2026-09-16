import { QuizEditor } from "@/components/admin/quiz-editor";
import { requireCapability } from "@/lib/auth/session";
import { listStaffProgramOptions } from "@/lib/compass/program-bridge";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";

export default async function AdminNewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string }>;
}) {
  redirectIfCompassAdminRoute();
  const session = await requireCapability("manageContent");
  const { programId } = await searchParams;
  const programOptions = await listStaffProgramOptions(
    session.user.organizationId,
  );
  const programs = programOptions.map((program) => ({
    id: program.id,
    title: program.title,
  }));

  const initialProgramId =
    programId && programs.some((program) => program.id === programId)
      ? programId
      : undefined;

  return <QuizEditor programs={programs} initialProgramId={initialProgramId} />;
}
