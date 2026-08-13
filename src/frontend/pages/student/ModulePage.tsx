import { FormEvent, useEffect, useState } from "react";
import { modulesGet, modulesPost, modulesPut } from "@frontend/services/api/programs";
import { Button } from "@frontend/components/common/button";
import { Input, Label, Textarea } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";

export function StudentModulePage({
  kind,
}: {
  kind:
    | "announcements"
    | "tickets"
    | "forums"
    | "applications"
    | "assignments"
    | "quizzes"
    | "certificates"
    | "profile"
    | "settings"
    | "programs";
}) {
  const [items, setItems] = useState<unknown[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    try {
      if (kind === "announcements") {
        setItems((await modulesGet<{ announcements: unknown[] }>("/announcements")).announcements);
      } else if (kind === "tickets") {
        setItems((await modulesGet<{ tickets: unknown[] }>("/tickets")).tickets);
      } else if (kind === "forums") {
        setItems(
          (await modulesGet<{ categories: unknown[] }>("/forums/categories")).categories,
        );
      } else if (kind === "applications") {
        setItems(
          (await modulesGet<{ applications: unknown[] }>("/applications")).applications,
        );
      } else if (kind === "assignments") {
        setItems((await modulesGet<{ assignments: unknown[] }>("/assignments")).assignments);
      } else if (kind === "quizzes") {
        setItems((await modulesGet<{ quizzes: unknown[] }>("/quizzes")).quizzes);
      } else if (kind === "certificates") {
        setItems(
          (await modulesGet<{ certificates: unknown[] }>("/certificates/me")).certificates,
        );
      } else if (kind === "programs") {
        setMsg("Browse published programmes from Courses.");
      }
    } catch {
      setMsg("Failed to load.");
    }
  }

  useEffect(() => {
    void refresh();
  }, [kind]);

  async function onTicket(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await modulesPost("/tickets", { subject: fd.get("subject") });
    e.currentTarget.reset();
    await refresh();
  }

  async function onProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await modulesPut("/profile", {
      name: fd.get("name"),
      phoneNumber: fd.get("phoneNumber"),
      username: fd.get("username"),
      headline: fd.get("headline"),
      bio: fd.get("bio"),
      theme: fd.get("theme"),
      careerPath: fd.get("careerPath"),
    });
    setMsg("Profile saved.");
  }

  const title =
    kind === "settings"
      ? "Settings"
      : kind.charAt(0).toUpperCase() + kind.slice(1).replace("-", " ");

  return (
    <div>
      <PageHeader title={title} />
      {msg ? <p className="text-sm text-fg-muted mb-4">{msg}</p> : null}
      {(kind === "profile" || kind === "settings") && (
        <Panel className="p-5 max-w-lg">
          <form onSubmit={onProfile} className="space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone</Label>
              <Input id="phoneNumber" name="phoneNumber" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" />
            </div>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input id="headline" name="headline" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" />
            </div>
            <div>
              <Label htmlFor="careerPath">Career path</Label>
              <Input id="careerPath" name="careerPath" />
            </div>
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Input id="theme" name="theme" defaultValue="system" />
            </div>
            <Button type="submit">Save</Button>
          </form>
        </Panel>
      )}
      {kind === "tickets" && (
        <Panel className="p-5 mb-6 max-w-lg">
          <form onSubmit={onTicket} className="space-y-3">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required />
            </div>
            <Button type="submit">Open ticket</Button>
          </form>
        </Panel>
      )}
      {kind !== "profile" && kind !== "settings" && kind !== "programs" ? (
        <Panel className="p-5">
          <ul className="space-y-2 text-sm">
            {items.map((item, i) => {
              const row = item as Record<string, unknown>;
              return (
                <li key={String(row.id ?? i)} className="border-b border-border py-2">
                  {String(row.title || row.name || row.subject || row.certificateId || row.id)}
                </li>
              );
            })}
            {items.length === 0 ? <p className="text-fg-muted">Nothing here yet.</p> : null}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
