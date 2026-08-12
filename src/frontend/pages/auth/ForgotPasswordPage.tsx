import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "@frontend/services/api/auth";
import { Button } from "@frontend/components/common/button";
import { Input, Label } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";

export function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await forgotPassword(String(fd.get("email")));
    setMessage(result.message);
    setResetUrl(result.resetUrl ?? null);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageHeader title="Forgot password" description="We’ll send reset instructions." />
      <Panel className="p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">
            Request reset
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-fg-muted">{message}</p> : null}
        {resetUrl ? (
          <p className="mt-2 text-sm">
            Dev reset link:{" "}
            <Link to={resetUrl} className="underline text-brand">
              {resetUrl}
            </Link>
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
