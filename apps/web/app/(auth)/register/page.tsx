import { RegisterForm } from "@/components/auth/register-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      description="Create a student account to enroll in courses."
    >
      <RegisterForm />
    </AuthShell>
  );
}
