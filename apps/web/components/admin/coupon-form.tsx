"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCoupon } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHelp, Input, Label, Select } from "@/components/ui/input";

type ProgramOption = { id: string; title: string };

export function CouponForm({
  programs,
  defaultExpiresAt,
}: {
  programs: ProgramOption[];
  defaultExpiresAt: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [scope, setScope] = useState<"GLOBAL" | "SPECIFIC">("GLOBAL");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await createCoupon(data);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setType("PERCENTAGE");
      setScope("GLOBAL");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          name="code"
          required
          minLength={3}
          maxLength={32}
          placeholder="FOUNDERS25"
          autoComplete="off"
          className="uppercase"
        />
        <FieldHelp>Students enter this at checkout. Letters, numbers, - or _.</FieldHelp>
      </div>
      <div>
        <Label htmlFor="description">Note (optional)</Label>
        <Input
          id="description"
          name="description"
          placeholder="Launch week for YGP"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="type">Discount</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(event) =>
              setType(event.target.value === "FIXED" ? "FIXED" : "PERCENTAGE")
            }
          >
            <option value="PERCENTAGE">Percent off</option>
            <option value="FIXED">Fixed amount</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="value">{type === "FIXED" ? "Amount" : "Percent"}</Label>
          <Input
            id="value"
            name="value"
            type="number"
            min={0.01}
            max={type === "PERCENTAGE" ? 100 : undefined}
            step={type === "PERCENTAGE" ? 1 : 0.01}
            required
            placeholder={type === "PERCENTAGE" ? "15" : "2500"}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="scope">Applies to</Label>
        <Select
          id="scope"
          name="scope"
          value={scope}
          onChange={(event) =>
            setScope(event.target.value === "SPECIFIC" ? "SPECIFIC" : "GLOBAL")
          }
        >
          <option value="GLOBAL">Every program</option>
          <option value="SPECIFIC">Selected programs</option>
        </Select>
      </div>
      {scope === "SPECIFIC" ? (
        <fieldset className="space-y-2 rounded-[var(--radius-sm)] border border-border p-3">
          <legend className="px-1 text-xs font-medium text-fg">Programs</legend>
          {programs.length === 0 ? (
            <p className="text-xs text-fg-muted">No programs in the catalog yet.</p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-auto">
              {programs.map((program) => (
                <li key={program.id}>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="programIds" value={program.id} />
                    <span>{program.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="expiresAt">Expires</Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            required
            defaultValue={defaultExpiresAt}
          />
        </div>
        <div>
          <Label htmlFor="maxUses">Max uses</Label>
          <Input id="maxUses" name="maxUses" type="number" min={0} defaultValue={0} />
          <FieldHelp>0 means unlimited.</FieldHelp>
        </div>
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending}>
        {pending ? "Creating…" : "Create coupon"}
      </Button>
    </form>
  );
}
