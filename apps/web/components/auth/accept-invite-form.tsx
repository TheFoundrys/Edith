"use client";

import { FormEvent, useState } from "react";
import { acceptStaffInvite } from "@/lib/actions/invites";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function AcceptInviteForm({
  token,
  email,
  name,
  organizationName,
  roleLabel,
}: {
  token: string;
  email: string;
  name: string;
  organizationName: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await acceptStaffInvite(new FormData(event.currentTarget));
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/login?invite=accepted");
  }

  return (
    <>
      <BrandMark />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Accept invitation</h1>
      <p className="mt-2 text-sm text-fg-muted">
        Join {organizationName} as {roleLabel}. This creates your staff account.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled />
        </div>
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required defaultValue={name} autoComplete="name" />
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
          />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" className="w-full" loading={pending}>
          {pending ? "Creating account…" : "Create staff account"}
        </Button>
      </form>
    </>
  );
}
