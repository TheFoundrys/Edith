import { PasswordForm } from "@/components/student/password-form";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";

export default async function StudentSettingsPage() {
  await requireStudent();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your password and account preferences."
      />
      <Panel className="p-5">
        <h2 className="text-sm font-medium mb-4">Change password</h2>
        <PasswordForm />
      </Panel>
    </div>
  );
}
