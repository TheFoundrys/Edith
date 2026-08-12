"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startApplication } from "@/lib/actions/applications";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function StartApplicationButton({
  programId,
  intakes,
  fullWidth = false,
}: {
  programId: string;
  intakes: { id: string; name: string }[];
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [intakeId, setIntakeId] = useState(intakes[0]?.id ?? "");

  if (!intakes.length) {
    return (
      <p className="text-xs text-fg-muted">No open intakes for this program.</p>
    );
  }

  return (
    <div
      className={
        fullWidth
          ? "flex flex-col items-stretch gap-2 w-full"
          : "flex flex-col items-stretch sm:items-end gap-2"
      }
    >
      {intakes.length > 1 ? (
        <div className={fullWidth ? "w-full" : "w-full sm:w-56"}>
          <Label htmlFor={`intake-${programId}`}>Intake</Label>
          <Select
            id={`intake-${programId}`}
            value={intakeId}
            onChange={(e) => setIntakeId(e.target.value)}
          >
            {intakes.map((intake) => (
              <option key={intake.id} value={intake.id}>
                {intake.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      <Button
        size="sm"
        className={fullWidth ? "w-full" : undefined}
        loading={pending}
        disabled={!intakeId}
        onClick={() =>
          startTransition(async () => {
            const result = await startApplication(programId, intakeId);
            if (result.error) {
              toast({ title: "Could not start application", description: result.error, tone: "danger" });
              return;
            }
            toast({ title: "Application opened" });
            router.push(`/student/applications/${result.id}`);
          })
        }
      >
        {pending ? "Starting…" : "Apply"}
      </Button>
    </div>
  );
}
