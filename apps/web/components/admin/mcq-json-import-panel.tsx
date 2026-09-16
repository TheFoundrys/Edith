"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MCQ_IMPORT_EXAMPLE } from "@/lib/assessments/mcq-import";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

type ImportResult =
  | { ok: true; imported: number; skipped: number; total: number; needsRepublish?: boolean }
  | { error: string };

export function McqJsonImportPanel({
  mcqId,
  action,
  bankSize,
  isPublished,
}: {
  mcqId: string;
  action: (formData: FormData) => Promise<ImportResult | void>;
  bankSize: number;
  isPublished?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (!result) {
        router.refresh();
        return;
      }
      if ("error" in result) {
        toast({ title: "Import failed", description: result.error, tone: "danger" });
        return;
      }
      const republishNote =
        result.needsRepublish
          ? " Republish before students see the updated bank."
          : isPublished
            ? " Live for students — new questions are in the bank."
            : "";
      toast({
        title: `Imported ${result.imported} question${result.imported === 1 ? "" : "s"}`,
        description:
          (result.skipped > 0 ? `${result.skipped} skipped. ` : "") +
          `Bank now has ${result.total} questions.${republishNote}`,
        tone: "success",
      });
      router.refresh();
    });
  }

  return (
    <Panel className="p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg text-brand">Bulk JSON import</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Paste an array of questions or{" "}
          <code className="text-xs">{`{ "questions": [...] }`}</code>. Each
          question needs <code className="text-xs">prompt</code> (or{" "}
          <code className="text-xs">question</code>),{" "}
          <code className="text-xs">options</code>, and{" "}
          <code className="text-xs">correctIndex</code> (or{" "}
          <code className="text-xs">correctAnswer</code>). Current bank:{" "}
          {bankSize} questions.
          {isPublished ? (
            <span className="block mt-1">
              Appending keeps the quiz live. Replacing the bank requires republish.
            </span>
          ) : null}
        </p>
      </div>
      <form action={onSubmit} className="space-y-3">
        <input type="hidden" name="mcqId" value={mcqId} />
        <div>
          <Label htmlFor="json">JSON</Label>
          <Textarea
            id="json"
            name="json"
            rows={12}
            className="font-mono text-xs"
            placeholder={MCQ_IMPORT_EXAMPLE}
            required
            disabled={pending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="replace" disabled={pending} />
          Replace existing bank (otherwise append)
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Importing…" : "Import questions"}
        </Button>
      </form>
    </Panel>
  );
}
