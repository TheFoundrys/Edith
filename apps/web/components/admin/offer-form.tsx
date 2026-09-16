"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProgramOffer } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHelp, Input, Label, Select } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

type StudentOption = { id: string; name: string; email: string };
type ProgramOption = {
  id: string;
  title: string;
  listPrice: number;
  currency: string;
};

export function OfferForm({
  students,
  programs,
}: {
  students: StudentOption[];
  programs: ProgramOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");

  const selected = useMemo(
    () => programs.find((program) => program.id === programId) ?? null,
    [programId, programs],
  );

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await createProgramOffer(data);
      if (result.error) {
        setError(result.error);
        return;
      }
      form.reset();
      setProgramId(programs[0]?.id ?? "");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <Label htmlFor="userId">Student</Label>
        <Select id="userId" name="userId" required defaultValue="">
          <option value="" disabled>
            Select student
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} · {student.email}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="programId">Program</Label>
        <Select
          id="programId"
          name="programId"
          required
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
        >
          <option value="" disabled>
            Select program
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </Select>
        {selected ? (
          <FieldHelp>
            Catalog price{" "}
            {selected.listPrice > 0
              ? formatCurrency(selected.listPrice, selected.currency)
              : "not set"}
            . The offer replaces this at checkout.
          </FieldHelp>
        ) : null}
      </div>
      <div>
        <Label htmlFor="customPrice">Offered tuition</Label>
        <Input
          id="customPrice"
          name="customPrice"
          type="number"
          min={0.01}
          step={0.01}
          required
          placeholder={
            selected?.listPrice ? String(selected.listPrice) : "35000"
          }
        />
      </div>
      <FieldError>{error}</FieldError>
      <Button type="submit" loading={pending} disabled={!students.length || !programs.length}>
        {pending ? "Saving…" : "Save offer"}
      </Button>
    </form>
  );
}
