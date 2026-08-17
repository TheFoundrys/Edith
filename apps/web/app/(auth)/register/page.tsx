"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { registerStudent } from "@/lib/actions/auth";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { resolveAuthRedirect } from "@/lib/auth/redirect";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await registerStudent(fd);
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      const loginHref = callbackUrl
        ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login";
      router.push(loginHref);
      return;
    }
    router.push(resolveAuthRedirect("STUDENT", callbackUrl));
    router.refresh();
  }

  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-fg-muted">
            At least 10 characters, including a letter and a number.
          </p>
        </div>
        <label className="flex items-start gap-2.5 pt-1 text-sm leading-relaxed">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-1 accent-brand"
          />
          <span>
            I agree to the{" "}
            <Link href="/legal/terms" className="underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/legal/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        <FieldError>{error}</FieldError>
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-fg-muted">
        Already have an account?{" "}
        <Link href={loginHref} className="link-quiet">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      description="Create a student account to enroll in courses."
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
