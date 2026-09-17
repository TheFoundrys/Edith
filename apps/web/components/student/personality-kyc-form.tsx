"use client";

import { useState, useTransition } from "react";
import { UserRound } from "lucide-react";
import {
  savePersonalityIdentity,
  savePersonalityKyc,
} from "@/lib/actions/personality-profile";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export type PersonalityIdentityDefaults = {
  name: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
};

function SummaryRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("personality-identity-summary-row", className)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PersonalityIdentityStep({
  defaults,
  aadhaarMask,
  panMask,
  locked,
  resumeOnFile,
}: {
  defaults: PersonalityIdentityDefaults;
  aadhaarMask?: string | null;
  panMask?: string | null;
  locked?: boolean;
  resumeOnFile?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const complete = Boolean(aadhaarMask && panMask);

  if (complete && !editing) {
    return (
      <div className="personality-identity-summary">
        <div className="personality-identity-summary-block">
          <h3>Identity</h3>
          <dl className="personality-identity-summary-grid">
            <SummaryRow label="Name" value={defaults.name} />
            <SummaryRow label="Full name" value={defaults.fullName} />
            <SummaryRow label="Phone" value={defaults.phone} />
            <SummaryRow label="Email" value={defaults.email} />
            <SummaryRow label="Aadhaar" value={aadhaarMask ?? "—"} />
            <SummaryRow label="PAN" value={panMask ?? "—"} />
            <SummaryRow
              label="Address"
              value={defaults.address}
              className="sm:col-span-2"
            />
          </dl>
        </div>

        {locked ? (
          <p className="text-xs text-fg-muted">Details are locked after the exam.</p>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setEditing(true)}
          >
            Edit details
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="personality-identity-form">
      {resumeOnFile ? (
        <p className="text-sm text-fg-muted">
          Resume is on file. Finish your contact and ID details to continue.
        </p>
      ) : null}

      <form
        className="personality-identity-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          setError(null);
          const fd = new FormData(event.currentTarget);
          setSaving(true);
          void (async () => {
            const result = await savePersonalityIdentity(fd);
            if (!result.ok) {
              setError(result.error ?? "Could not save details.");
              setSaving(false);
              return;
            }
            setEditing(false);
            router.replace("/student/personality-profile?identity=saved");
            router.refresh();
          })();
        }}
      >
        <section className="personality-identity-section" aria-labelledby="identity-contact">
          <div className="personality-identity-section-head" id="identity-contact">
            <UserRound className="size-4" aria-hidden />
            <span>Identity</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={defaults.name}
                autoComplete="given-name"
              />
            </div>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                defaultValue={defaults.fullName}
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                inputMode="tel"
                defaultValue={defaults.phone}
                autoComplete="tel"
                placeholder="10-digit mobile"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaults.email}
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="aadhaar">Aadhaar number</Label>
              <Input
                id="aadhaar"
                name="aadhaar"
                autoComplete="off"
                required={!aadhaarMask}
                maxLength={32}
                placeholder={aadhaarMask ?? "As on Aadhaar card"}
              />
              {aadhaarMask ? (
                <p className="personality-id-on-file">On file · {aadhaarMask}</p>
              ) : (
                <p className="personality-field-hint">
                  Type it as printed on the card. We store a masked copy only.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                name="pan"
                autoComplete="off"
                required={!panMask}
                maxLength={32}
                placeholder={panMask ?? "As on PAN card"}
              />
              {panMask ? (
                <p className="personality-id-on-file">On file · {panMask}</p>
              ) : (
                <p className="personality-field-hint">
                  Enter the PAN as printed — letters, numbers, and spacing as shown.
                </p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              required
              rows={3}
              defaultValue={defaults.address}
              autoComplete="street-address"
            />
          </div>
        </section>

        <FieldError>{error}</FieldError>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={saving}>
            {saving ? "Saving…" : "Save and continue"}
          </Button>
          {complete ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setError(null);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export function PersonalityResumeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const fd = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await savePersonalityKyc(fd);
          if (!result.ok) {
            setError(result.error ?? "Could not save resume.");
            return;
          }
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-fg-muted leading-relaxed">
        Edith extracts skill keywords and recommends the mandatory sitting.
      </p>
      <div>
        <Label htmlFor="resume">Resume</Label>
        <Input
          id="resume"
          name="resume"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </div>
      <div>
        <Label htmlFor="skills">Skills on the resume (optional)</Label>
        <Input
          id="skills"
          name="skills"
          placeholder="Python, cybersecurity, teaching…"
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending}>
        {pending ? "Reading resume…" : "Extract skills and recommend exam"}
      </Button>
    </form>
  );
}
