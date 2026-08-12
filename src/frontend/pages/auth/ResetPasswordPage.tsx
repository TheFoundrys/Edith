import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "@frontend/services/api/auth";
import { Button } from "@frontend/components/common/button";
import { Input, Label } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { ApiClientError } from "@frontend/services/api/client";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const token = params.get("token") || "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const result = await resetPassword({
        token,
        password: String(fd.get("password")),
        confirmPassword: String(fd.get("confirmPassword")),
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      navigate("/login");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <PageHeader title="Reset password" />
      <Panel className="p-5">
        {!token ? (
          <p className="text-sm">
            Missing token. <Link to="/forgot-password">Request a new link</Link>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required minLength={10} />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={10}
              />
            </div>
            {error ? <p className="text-sm text-fg">{error}</p> : null}
            <Button type="submit" loading={loading} className="w-full">
              Update password
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}
