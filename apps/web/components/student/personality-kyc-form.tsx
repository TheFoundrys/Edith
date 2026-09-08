"use client";

import { useState, useTransition } from "react";
import {
  savePersonalityIdentity,
  savePersonalityKyc,
  unlinkPersonalityAadhaar,
} from "@/lib/actions/personality-profile";
import type { AadhaarSource } from "@/lib/assessments/personality-kyc";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FieldError, Input, Label } from "@/components/ui/input";
import { useRouter } from "next/navigation";

function sourceLabel(source?: AadhaarSource | null) {
  return source === "digilocker" ? "via DigiLocker" : "by Aadhaar number";
}

export function PersonalityIdentityStep({
  aadhaarMask,
  aadhaarName,
  aadhaarSource,
  panMask,
  canUnlink,
  resumeOnFile,
  digilockerAvailable,
}: {
  aadhaarMask?: string | null;
  aadhaarName?: string | null;
  aadhaarSource?: AadhaarSource | null;
  panMask?: string | null;
  canUnlink?: boolean;
  resumeOnFile?: boolean;
  digilockerAvailable?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  if (aadhaarMask && panMask) {
    return (
      <div className="space-y-3">
        <p className="text-sm">
          Aadhaar verified {sourceLabel(aadhaarSource)} · {aadhaarMask}
          {aadhaarName ? ` · ${aadhaarName}` : ""}
        </p>
        <p className="text-sm">PAN on file · {panMask}</p>
        {canUnlink ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
            >
              Unlink Aadhaar
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              title="Unlink Aadhaar?"
              description="This removes the Aadhaar link from this sitting. PAN and resume stay on file. You must verify again before the exam."
              confirmLabel="Unlink"
              danger
              pending={pending}
              onCancel={() => setConfirmOpen(false)}
              onConfirm={() => {
                startTransition(async () => {
                  const result = await unlinkPersonalityAadhaar();
                  if (!result.ok) {
                    setError(result.error ?? "Could not unlink Aadhaar.");
                    setConfirmOpen(false);
                    return;
                  }
                  setConfirmOpen(false);
                  router.replace("/student/personality-profile");
                  router.refresh();
                });
              }}
            />
          </>
        ) : (
          <p className="text-xs text-fg-muted">
            Identity is locked after the exam.
          </p>
        )}
        <FieldError>{error}</FieldError>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-fg-muted leading-relaxed">
        Edith stores hashes and masked last characters only — never the full
        numbers.
      </p>
      {resumeOnFile ? (
        <p className="text-sm text-fg-muted">
          Resume is still on file. Finish identity to continue.
        </p>
      ) : null}
      {aadhaarMask ? (
        <p className="text-sm">
          Aadhaar verified {sourceLabel(aadhaarSource)} · {aadhaarMask}
          {aadhaarName ? ` · ${aadhaarName}` : ""}
        </p>
      ) : null}
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          setError(null);
          const fd = new FormData(event.currentTarget);
          setSaving(true);
          void (async () => {
            const result = await savePersonalityIdentity(fd);
            if (!result.ok) {
              setError(result.error ?? "Could not save identity.");
              setSaving(false);
              return;
            }
            router.replace("/student/personality-profile?identity=verified");
            router.refresh();
          })();
        }}
      >
        {!aadhaarMask ? (
          <div>
            <Label htmlFor="aadhaar">Aadhaar number</Label>
            <Input
              id="aadhaar"
              name="aadhaar"
              inputMode="numeric"
              autoComplete="off"
              required
              minLength={12}
              maxLength={14}
              placeholder="12-digit Aadhaar"
              aria-invalid={Boolean(error)}
            />
            <p className="mt-1 text-xs text-fg-muted">
              The last digit is a checksum — any random 12 digits will be
              rejected. The form stores a hash and last-four only.
            </p>
          </div>
        ) : null}
        {!panMask ? (
          <div>
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              name="pan"
              autoComplete="off"
              required
              placeholder="ABCDE1234F"
              className="uppercase"
            />
          </div>
        ) : null}
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={saving}>
          {saving ? "Saving…" : aadhaarMask ? "Save PAN" : "Verify identity"}
        </Button>
      </form>
      {!aadhaarMask && digilockerAvailable ? (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-xs text-fg-muted">Or verify Aadhaar with DigiLocker, then add PAN</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              window.location.href = "/api/digilocker/start";
            }}
          >
            Verify with DigiLocker
          </Button>
        </div>
      ) : null}
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
