import { FormEvent, useEffect, useState } from "react";
import { modulesGet, modulesPost, modulesPut } from "@frontend/services/api/programs";
import { Button } from "@frontend/components/common/button";
import { Input, Label, Textarea } from "@frontend/components/forms/input";
import { PageHeader, Panel } from "@frontend/components/layout/page";

type CrudKind =
  | "announcements"
  | "coupons"
  | "badges"
  | "forums"
  | "email-templates"
  | "payment-settings"
  | "tickets"
  | "offers"
  | "applications"
  | "assignments"
  | "quizzes"
  | "roles"
  | "syllabus"
  | "plugins";

const TITLES: Record<CrudKind, string> = {
  announcements: "Announcements",
  coupons: "Coupons",
  badges: "Badges",
  forums: "Forums",
  "email-templates": "Email templates",
  "payment-settings": "Payment settings",
  tickets: "Tickets",
  offers: "Offers",
  applications: "Applications",
  assignments: "Assignments",
  quizzes: "Quizzes",
  roles: "Roles",
  syllabus: "Syllabus",
  plugins: "AI plugins",
};

export function AdminModulePage({ kind }: { kind: CrudKind }) {
  const [items, setItems] = useState<unknown[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setMsg(null);
    try {
      if (kind === "announcements") {
        const r = await modulesGet<{ announcements: unknown[] }>("/announcements");
        setItems(r.announcements);
      } else if (kind === "coupons") {
        const r = await modulesGet<{ coupons: unknown[] }>("/coupons");
        setItems(r.coupons);
      } else if (kind === "badges") {
        const r = await modulesGet<{ badges: unknown[] }>("/badges");
        setItems(r.badges);
      } else if (kind === "forums") {
        const r = await modulesGet<{ categories: unknown[] }>("/forums/categories");
        setItems(r.categories);
      } else if (kind === "email-templates") {
        const r = await modulesGet<{ templates: unknown[] }>("/email-templates");
        setItems(r.templates);
      } else if (kind === "payment-settings") {
        const r = await modulesGet<{ settings: Record<string, unknown> | null }>(
          "/payment-settings",
        );
        setSettings(r.settings);
      } else if (kind === "tickets") {
        const r = await modulesGet<{ tickets: unknown[] }>("/tickets");
        setItems(r.tickets);
      } else if (kind === "offers") {
        const r = await modulesGet<{ offers: unknown[] }>("/offers");
        setItems(r.offers);
      } else if (kind === "applications") {
        const r = await modulesGet<{ applications: unknown[] }>("/applications");
        setItems(r.applications);
      } else if (kind === "assignments") {
        const r = await modulesGet<{ assignments: unknown[] }>("/assignments");
        setItems(r.assignments);
      } else if (kind === "quizzes") {
        const r = await modulesGet<{ quizzes: unknown[] }>("/quizzes");
        setItems(r.quizzes);
      } else {
        setItems([]);
        setMsg("UI shell ready — wire deeper editors in follow-up.");
      }
    } catch {
      setMsg("Failed to load.");
    }
  }

  useEffect(() => {
    void refresh();
  }, [kind]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (kind === "announcements") {
      await modulesPost("/announcements", {
        title: fd.get("title"),
        body: fd.get("body"),
      });
    } else if (kind === "coupons") {
      await modulesPost("/coupons", {
        code: fd.get("code"),
        value: Number(fd.get("value") || 0),
        expiresAt: fd.get("expiresAt"),
      });
    } else if (kind === "badges") {
      await modulesPost("/badges", {
        name: fd.get("name"),
        description: fd.get("description"),
      });
    } else if (kind === "forums") {
      await modulesPost("/forums/categories", {
        name: fd.get("name"),
        slug: fd.get("slug"),
      });
    } else if (kind === "email-templates") {
      await modulesPost("/email-templates", {
        name: fd.get("name"),
        subject: fd.get("subject"),
        bodyHtml: fd.get("bodyHtml"),
      });
    } else if (kind === "payment-settings") {
      await modulesPut("/payment-settings", {
        currency: fd.get("currency"),
        gstPercent: Number(fd.get("gstPercent") || 18),
        convenienceFeePercent: Number(fd.get("convenienceFeePercent") || 0),
        razorpayEnabled: fd.get("razorpayEnabled") === "on",
        stripeEnabled: fd.get("stripeEnabled") === "on",
      });
    }
    e.currentTarget.reset();
    await refresh();
  }

  return (
    <div>
      <PageHeader title={TITLES[kind]} />
      {msg ? <p className="text-sm text-fg-muted mb-4">{msg}</p> : null}
      <div className="grid lg:grid-cols-2 gap-6">
        {["announcements", "coupons", "badges", "forums", "email-templates", "payment-settings"].includes(
          kind,
        ) ? (
          <Panel className="p-5">
            <form onSubmit={onCreate} className="space-y-3">
              {kind === "announcements" ? (
                <>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div>
                    <Label htmlFor="body">Body</Label>
                    <Textarea id="body" name="body" required />
                  </div>
                </>
              ) : null}
              {kind === "coupons" ? (
                <>
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input id="code" name="code" required />
                  </div>
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input id="value" name="value" type="number" required />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expires</Label>
                    <Input id="expiresAt" name="expiresAt" type="date" required />
                  </div>
                </>
              ) : null}
              {kind === "badges" ? (
                <>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" name="description" />
                  </div>
                </>
              ) : null}
              {kind === "forums" ? (
                <>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" name="slug" />
                  </div>
                </>
              ) : null}
              {kind === "email-templates" ? (
                <>
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" required />
                  </div>
                  <div>
                    <Label htmlFor="bodyHtml">HTML</Label>
                    <Textarea id="bodyHtml" name="bodyHtml" />
                  </div>
                </>
              ) : null}
              {kind === "payment-settings" ? (
                <>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      name="currency"
                      defaultValue={String(settings?.currency ?? "INR")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gstPercent">GST %</Label>
                    <Input
                      id="gstPercent"
                      name="gstPercent"
                      type="number"
                      defaultValue={String(settings?.gstPercent ?? 18)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="convenienceFeePercent">Convenience fee %</Label>
                    <Input
                      id="convenienceFeePercent"
                      name="convenienceFeePercent"
                      type="number"
                      defaultValue={String(settings?.convenienceFeePercent ?? 0)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="razorpayEnabled"
                      defaultChecked={Boolean(settings?.razorpayEnabled)}
                    />
                    Razorpay
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="stripeEnabled"
                      defaultChecked={Boolean(settings?.stripeEnabled)}
                    />
                    Stripe
                  </label>
                </>
              ) : null}
              <Button type="submit">{kind === "payment-settings" ? "Save" : "Create"}</Button>
            </form>
          </Panel>
        ) : null}
        <Panel className="p-5">
          <ul className="space-y-2 text-sm">
            {items.map((item, i) => {
              const row = item as Record<string, unknown>;
              return (
                <li key={String(row.id ?? i)} className="border-b border-border py-2">
                  <span className="font-medium">
                    {String(row.title || row.name || row.code || row.subject || row.id)}
                  </span>
                  {row.status ? (
                    <span className="block text-xs text-fg-muted">{String(row.status)}</span>
                  ) : null}
                </li>
              );
            })}
            {items.length === 0 && kind !== "payment-settings" ? (
              <p className="text-fg-muted">No items.</p>
            ) : null}
            {kind === "payment-settings" && settings ? (
              <pre className="text-xs overflow-auto">{JSON.stringify(settings, null, 2)}</pre>
            ) : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
