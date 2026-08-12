import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, me } from "@frontend/services/api/auth";
import { useAuth } from "@frontend/store/auth";
import { Button } from "@frontend/components/common/button";
import { Input, Label } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { ApiClientError } from "@frontend/services/api/client";

export function LoginPage() {
  const navigate = useNavigate();
  const { setMe } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      const session = await me();
      setMe(session);
      navigate(session.isStaff ? "/admin" : "/student/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageHeader title="Log in" description="Sign in to EDITH." />
      <Panel className="p-5">
        <form onSubmit={onSubmit} className="space-y-3">
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
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-fg">{error}</p> : null}
          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>
        <p className="mt-4 text-sm text-fg-muted">
          <Link to="/forgot-password" className="underline">
            Forgot password?
          </Link>
          {" · "}
          <Link to="/register" className="underline">
            Create account
          </Link>
        </p>
      </Panel>
    </div>
  );
}
