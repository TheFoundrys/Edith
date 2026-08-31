import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Use your institution or student credentials."
    >
      <LoginForm />
    </AuthShell>
  );
}
