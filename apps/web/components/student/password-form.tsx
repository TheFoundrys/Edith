"use client";

import { useState, useTransition } from "react";
import { changeStudentPassword } from "@/lib/actions/enrollments";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/input";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await changeStudentPassword({
            currentPassword,
            newPassword,
          });
          if (result.error) {
            setError(result.error);
            return;
          }
          setCurrentPassword("");
          setNewPassword("");
          setSaved(true);
        });
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Current password</span>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">New password</span>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
      </label>
      <Button type="submit" loading={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
      <FieldError>{error}</FieldError>
      {saved ? <p className="text-sm text-fg-muted">Password updated.</p> : null}
    </form>
  );
}
