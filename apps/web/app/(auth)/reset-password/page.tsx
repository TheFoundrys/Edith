"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { APP_NAME } from "@/lib/brand";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(
    token ? null : "Reset link is missing or invalid.",
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("token", token);
    const result = await resetPassword(fd);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/login?reset=success");
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          disabled={!token}
        />
        <p className="mt-1 text-xs text-fg-muted">
          At least 10 characters, including a letter and a number.
        </p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          disabled={!token}
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" className="w-full" loading={pending} disabled={!token}>
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <BrandMark showTagline />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Set new password</h1>
          <p className="mt-2 text-sm text-fg-muted">
            {`Choose a new password for your ${APP_NAME} account.`}
          </p>
          <Suspense>
            <ResetForm />
          </Suspense>
          <p className="mt-6 text-sm text-fg-muted">
            <Link href="/login" className="text-fg underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
