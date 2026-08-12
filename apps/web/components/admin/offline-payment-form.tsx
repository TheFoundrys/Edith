"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markApplicationFeePaidOffline } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export function OfflinePaymentForm({
  applicationId,
  amount,
  currency,
  canRecord,
}: {
  applicationId: string;
  amount: number | null;
  currency: string;
  canRecord: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  if (!canRecord) {
    return (
      <p className="text-sm text-fg-muted">
        Offline fee recording is available when status is Offered or Fee requested.
      </p>
    );
  }

  if (amount == null || amount <= 0) {
    return (
      <p className="text-sm text-fg-muted">
        Set an application fee on the program before recording payment.
      </p>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await markApplicationFeePaidOffline(applicationId, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-fg-muted">
        Record bank transfer / cash / offline collection of{" "}
        <span className="font-medium text-fg">{formatCurrency(amount, currency)}</span>{" "}
        and enroll the applicant.
      </p>
      <div>
        <Label htmlFor="offline-note">Note (optional)</Label>
        <Input
          id="offline-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="UTR / receipt reference"
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" variant="secondary" size="sm" loading={pending}>
        {pending ? "Recording…" : "Mark fee paid (offline)"}
      </Button>
    </form>
  );
}
