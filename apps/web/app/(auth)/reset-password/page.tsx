import { PasswordPageShell } from "@/components/layout/password-page-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <PasswordPageShell>
      <ResetPasswordForm />
    </PasswordPageShell>
  );
}
