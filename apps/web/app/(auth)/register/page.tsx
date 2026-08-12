"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { registerStudent } from "@/lib/actions/auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { SiteFooter } from "@/components/layout/site-footer";
import { PeakArtBackdrop } from "@/components/layout/peak-art-backdrop";
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
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1" />
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
        <Link href={loginHref} className="text-fg underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-full flex flex-col peak-atmosphere">
      <PeakArtBackdrop variant="marketing" />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm peak-rise">
          <BrandMark showTagline />
          <h1 className="mt-10 font-display text-3xl tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            Create a student account to enroll in courses.
          </p>
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
