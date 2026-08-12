import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@frontend/services/api/auth";
import { Button } from "@frontend/components/common/button";
import { Input, Label } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { ApiClientError } from "@frontend/services/api/client";

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await register({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        consent: fd.get("consent") === "on",
      });
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageHeader title="Register" description="Create a student account." />
      <Panel className="p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={10} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="consent" required />
            I accept the Terms and Privacy Policy
          </label>
          {error ? <p className="text-sm text-fg">{error}</p> : null}
          <Button type="submit" loading={loading} className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-sm text-fg-muted">
          Already have an account?{" "}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </Panel>
    </div>
  );
}
