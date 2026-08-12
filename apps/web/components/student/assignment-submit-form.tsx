"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitAssignment } from "@/lib/actions/learning-extras";
import { Button } from "@/components/ui/button";
import { FieldError, Textarea } from "@/components/ui/input";

export function AssignmentSubmitForm({
  assignmentId,
  initialContent,
  alreadySubmitted,
  submittedAt,
}: {
  assignmentId: string;
  initialContent?: string;
  alreadySubmitted?: boolean;
  submittedAt?: string | Date | null;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent ?? "");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleString()
    : null;

  if (alreadySubmitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          Submission locked
          {submittedLabel ? ` · ${submittedLabel}` : ""}. You cannot edit this
          assignment after submitting.
        </p>
        <div className="border border-border bg-bg p-[var(--grid-gap)] text-sm whitespace-pre-wrap text-fg">
          {initialContent?.trim() || "—"}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/student/assignments")}
        >
          Back to assignments
        </Button>
      </div>
    );
  }

  function requestSubmit() {
    setError(null);
    if (content.trim().length < 10) {
      setError("Submission must be at least 10 characters.");
      return;
    }
    setConfirmOpen(true);
  }

  function confirmAndSubmit() {
    setConfirmOpen(false);
    setError(null);
    startTransition(async () => {
      const result = await submitAssignment(assignmentId, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Take the candidate out of the editor after a successful submit.
      router.push("/student/assignments");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={8}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your submission…"
        disabled={pending}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={requestSubmit} loading={pending}>
          {pending ? "Submitting…" : "Submit assignment"}
        </Button>
      </div>
      <FieldError>{error}</FieldError>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-confirm-title"
        >
          <div className="w-full max-w-md border border-border bg-bg-elevated p-[var(--grid-pad)] shadow-none">
            <h3
              id="assign-confirm-title"
              className="font-display text-xl text-fg"
            >
              Confirm submission
            </h3>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              Once submitted, this assignment is locked and you cannot edit it.
              Continue?
            </p>
            <div className="mt-[var(--grid-pad)] flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={pending}
                onClick={confirmAndSubmit}
              >
                {pending ? "Submitting…" : "Yes, submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
