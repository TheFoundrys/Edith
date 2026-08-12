"use client";

import { useState, useTransition } from "react";
import { updateStudentProfileExtended } from "@/lib/actions/compass-modules";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

export function ProfileForm({
  initialName,
  email,
  phoneNumber,
  username,
  headline,
  bio,
  theme,
  careerPath,
}: {
  initialName: string;
  email: string;
  phoneNumber?: string | null;
  username?: string | null;
  headline?: string | null;
  bio?: string | null;
  theme?: string | null;
  careerPath?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 max-w-lg"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await updateStudentProfileExtended(fd);
          if (result.error) {
            setError(result.error);
            return;
          }
          setSaved(true);
        });
      }}
    >
      <label className="block space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={initialName} required />
      </label>
      <label className="block space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled readOnly />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="phoneNumber">Phone</Label>
        <Input id="phoneNumber" name="phoneNumber" defaultValue={phoneNumber ?? ""} />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" defaultValue={username ?? ""} />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" name="headline" defaultValue={headline ?? ""} />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={bio ?? ""} rows={3} />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="careerPath">Career path</Label>
        <Input id="careerPath" name="careerPath" defaultValue={careerPath ?? ""} />
      </label>
      <label className="block space-y-1.5">
        <Label htmlFor="theme">Theme</Label>
        <Input id="theme" name="theme" defaultValue={theme ?? "system"} />
      </label>
      <Button type="submit" loading={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
      <FieldError>{error}</FieldError>
      {saved ? <p className="text-sm text-fg-muted">Profile updated.</p> : null}
    </form>
  );
}
