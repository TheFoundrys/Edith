import { PasswordPageShell } from "@/components/layout/password-page-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <PasswordPageShell>
      <ForgotPasswordForm />
    </PasswordPageShell>
  );
}
