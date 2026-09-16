import { AssignmentEditor } from "@/components/admin/assignment-editor";
import { requireCapability } from "@/lib/auth/session";
import { listStaffProgramOptions } from "@/lib/compass/program-bridge";

export default async function AdminNewAssignmentPage() {
  const session = await requireCapability("manageContent");
  const programOptions = await listStaffProgramOptions(
    session.user.organizationId,
  );
  const programs = programOptions.map((program) => ({
    id: program.id,
    title: program.title,
  }));

  return <AssignmentEditor programs={programs} />;
}
