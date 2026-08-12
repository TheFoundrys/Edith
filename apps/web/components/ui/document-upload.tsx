"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentUploadField({
  id,
  label,
  required,
  help,
  error,
  fileName,
  downloadHref,
  disabled,
  pending,
  onUpload,
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  fileName?: string | null;
  downloadHref?: string | null;
  disabled?: boolean;
  pending?: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-fg mb-1.5">
        {label}
        {required ? " *" : ""}
      </label>
      <div
        className={cn(
          "rounded-[var(--radius-sm)] border border-dashed border-border-strong bg-bg-elevated px-3 py-3",
          error ? "border-fg" : "",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {!disabled ? (
            <>
              <input
                ref={inputRef}
                id={id}
                type="file"
                className="sr-only"
                accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif,application/pdf"
                aria-invalid={Boolean(error)}
                aria-describedby={[help ? helpId : null, error ? errorId : null]
                  .filter(Boolean)
                  .join(" ") || undefined}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={pending}
                onClick={() => inputRef.current?.click()}
              >
                {pending ? "Uploading…" : fileName ? "Replace file" : "Choose file"}
              </Button>
            </>
          ) : null}
          {fileName ? (
            <span className="text-sm text-fg truncate max-w-[16rem]">{fileName}</span>
          ) : (
            <span className="text-sm text-fg-muted">No file uploaded</span>
          )}
          {downloadHref && fileName ? (
            <a
              href={downloadHref}
              className="text-xs underline underline-offset-2 text-fg-muted hover:text-fg"
            >
              Download
            </a>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-fg-muted">
          PDF, Word, or image · max 10 MB
        </p>
      </div>
      {help ? (
        <p id={helpId} className="mt-1 text-xs text-fg-muted">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
