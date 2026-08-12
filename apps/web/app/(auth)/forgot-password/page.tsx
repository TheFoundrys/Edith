"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setDevUrl(null);
    const fd = new FormData(e.currentTarget);
    const result = await requestPasswordReset(fd);
    setPending(false);
    setMessage(result.message);
    if ("resetUrl" in result && result.resetUrl) {
      setDevUrl(result.resetUrl);
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <BrandMark showTagline />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">Reset password</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Enter your account email. If it exists, we will provide reset instructions.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" loading={pending}>
              {pending ? "Sending…" : "Continue"}
            </Button>
          </form>
          {message ? (
            <p className="mt-4 text-sm text-fg-muted" role="status">
              {message}
            </p>
          ) : null}
          {devUrl ? (
            <p className="mt-3 text-sm">
              Dev reset link:{" "}
              <Link href={devUrl} className="underline underline-offset-2">
                Set a new password
              </Link>
            </p>
          ) : null}
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
