"use client";

import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { resolveAuthRedirect } from "@/lib/auth/redirect";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");
  const noticeParam = searchParams.get("notice");
  const resetParam = searchParams.get("reset");
  const [error, setError] = useState<string | null>(
    errorParam === "session_expired" || noticeParam === "session_expired"
      ? "Your session expired. Please sign in again."
      : null,
  );
  const [info] = useState<string | null>(
    resetParam === "success"
      ? "Password updated. Sign in with your new password."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await signIn("credentials", {
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
        redirect: false,
      });
      if (res?.error) {
        setPending(false);
        setError("Invalid email or password");
        return;
      }

      const session = await getSession();
      const dest = resolveAuthRedirect(session?.user?.role, callbackUrl);
      // Full navigation so a stale /login?error=session_expired document
      // cannot keep running and clear the new session cookie.
      window.location.assign(dest);
    } catch {
      setPending(false);
      setError("Network error — check that the app is running, then try again.");
    }
  }

  const registerHref = callbackUrl
    ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/register";

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-fg-muted hover:text-fg underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <FieldError>{error}</FieldError>
        {info ? (
          <p className="text-sm text-fg-muted" role="status">
            {info}
          </p>
        ) : null}
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-fg-muted">
        New student?{" "}
        <Link href={registerHref} className="link-quiet">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Use your institution or student credentials."
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
