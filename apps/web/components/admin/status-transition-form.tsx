"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ApplicationStatus } from "@prisma/client";
import { transitionApplicationStatus } from "@/lib/actions/applications";
import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";
import { Button } from "@/components/ui/button";
import { FieldError, Label, Select, Textarea } from "@/components/ui/input";

export function StatusTransitionForm({
  applicationId,
  nextStatuses,
}: {
  applicationId: string;
  nextStatuses: ApplicationStatus[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!nextStatuses.length) {
    return <p className="text-sm text-fg-muted">No further transitions available.</p>;
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const toStatus = String(fd.get("toStatus")) as ApplicationStatus;
        const note = String(fd.get("note") || "");
        startTransition(async () => {
          setError(null);
          const result = await transitionApplicationStatus(
            applicationId,
            toStatus,
            note || undefined,
          );
          if (result.error) setError(result.error);
          else router.refresh();
        });
      }}
    >
      <div>
        <Label htmlFor="toStatus">Move to</Label>
        <Select id="toStatus" name="toStatus" required defaultValue={nextStatuses[0]}>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" placeholder="Optional note for the timeline" />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending}>
        {pending ? "Updating…" : "Update status"}
      </Button>
    </form>
  );
}
