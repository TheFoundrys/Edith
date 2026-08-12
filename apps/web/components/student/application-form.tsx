"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FormSchema } from "@/lib/forms/schema";
import { isFieldVisible, validateAnswers } from "@/lib/forms/schema";
import {
  saveApplicationAnswers,
  submitApplication,
  uploadApplicationDocument,
} from "@/lib/actions/applications";
import { ApplicationProgress } from "@/components/student/application-progress";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DocumentUploadField } from "@/components/ui/document-upload";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

type Doc = { fieldKey: string; fileName: string; storagePath: string };

export function ApplicationForm({
  applicationId,
  schema,
  initialAnswers,
  documents,
  readOnly,
}: {
  applicationId: string;
  schema: FormSchema;
  initialAnswers: Record<string, unknown>;
  documents: Doc[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [attest, setAttest] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>("just now");
  const [pending, startTransition] = useTransition();

  const section = schema.sections[sectionIndex];
  const docs = useMemo(
    () => Object.fromEntries(documents.map((d) => [d.fieldKey, d])),
    [documents],
  );

  const sectionStatus = useMemo(() => {
    return schema.sections.map((s) => {
      const fields = s.fields.filter(
        (f) => f.type !== "section" && isFieldVisible(f, answers) && f.required,
      );
      const complete = fields.every((f) => {
        const value = answers[f.key] ?? docs[f.key]?.fileName;
        if (f.type === "checkbox") return value === true;
        return value !== undefined && value !== null && value !== "";
      });
      return { id: s.id, title: s.title, complete };
    });
  }, [schema.sections, answers, docs]);

  const completionPercent = Math.round(
    (sectionStatus.filter((s) => s.complete).length / Math.max(sectionStatus.length, 1)) *
      100,
  );

  function setValue(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSavedAt(null);
  }

  function validateCurrentSection() {
    const errors: Record<string, string> = {};
    for (const field of section.fields) {
      if (field.type === "section" || !isFieldVisible(field, answers) || !field.required) {
        continue;
      }
      const value =
        field.type === "file"
          ? docs[field.key]?.fileName || answers[field.key]
          : answers[field.key];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (field.type === "checkbox" && value !== true);
      if (empty) errors[field.key] = `${field.label} is required`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function saveDraft() {
    startTransition(async () => {
      const result = await saveApplicationAnswers(applicationId, answers);
      if (result.error) {
        toast({ title: "Could not save", description: result.error, tone: "danger" });
        return;
      }
      setDirty(false);
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      toast({ title: "Draft saved", tone: "success" });
      router.refresh();
    });
  }

  function onUpload(fieldKey: string, file: File) {
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadApplicationDocument(applicationId, fieldKey, fd);
      if (result.error) {
        toast({ title: "Upload failed", description: result.error, tone: "danger" });
        return;
      }
      setValue(fieldKey, file.name);
      toast({ title: "Document uploaded", tone: "success" });
      router.refresh();
    });
  }

  function goReview() {
    const validation = validateAnswers(schema, {
      ...answers,
      ...Object.fromEntries(
        documents.map((d) => [d.fieldKey, d.fileName]),
      ),
    });
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      toast({
        title: "Complete required fields",
        description: "Some sections still need attention before review.",
        tone: "danger",
      });
      const firstKey = Object.keys(validation.errors)[0];
      const idx = schema.sections.findIndex((s) =>
        s.fields.some((f) => f.key === firstKey),
      );
      if (idx >= 0) {
        setReviewMode(false);
        setSectionIndex(idx);
      }
      return;
    }
    setFieldErrors({});
    setReviewMode(true);
  }

  function doSubmit() {
    startTransition(async () => {
      await saveApplicationAnswers(applicationId, answers);
      const result = await submitApplication(applicationId);
      setConfirmOpen(false);
      if (result.error) {
        toast({ title: "Submit failed", description: result.error, tone: "danger" });
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }
      toast({ title: "Application submitted", tone: "success" });
      router.refresh();
    });
  }

  if (reviewMode) {
    return (
      <div className="space-y-6">
        <Panel className="p-5 space-y-4">
          <h2 className="text-base font-medium">Review & submit</h2>
          <p className="text-sm text-fg-muted">
            Confirm your answers before submitting. Submitted applications cannot be edited.
          </p>
          {schema.sections.map((s) => (
            <div key={s.id} className="border-t border-border pt-4">
              <h3 className="text-xs uppercase tracking-wide text-fg-muted mb-2">
                {s.title}
              </h3>
              <dl className="space-y-2 text-sm">
                {s.fields
                  .filter((f) => f.type !== "section" && isFieldVisible(f, answers))
                  .map((field) => (
                    <div key={field.key} className="grid grid-cols-3 gap-2">
                      <dt className="text-fg-muted">{field.label}</dt>
                      <dd className="col-span-2 break-words">
                        {field.type === "file"
                          ? docs[field.key]?.fileName || "—"
                          : field.type === "checkbox"
                            ? answers[field.key]
                              ? "Yes"
                              : "No"
                            : String(answers[field.key] ?? "—")}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
          {!readOnly ? (
            <label className="flex items-start gap-2 text-sm pt-2">
              <input
                type="checkbox"
                checked={attest}
                onChange={(e) => setAttest(e.target.checked)}
                className="mt-1"
              />
              <span>
                I certify that the information provided is true and complete, and I agree to
                the{" "}
                <a href="/legal/terms" className="underline underline-offset-2">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/legal/privacy" className="underline underline-offset-2">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
          ) : null}
        </Panel>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setReviewMode(false)}>
            Back to form
          </Button>
          {!readOnly ? (
            <Button
              type="button"
              loading={pending}
              disabled={!attest}
              onClick={() => setConfirmOpen(true)}
            >
              Submit application
            </Button>
          ) : null}
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="Submit this application?"
          description="You will not be able to edit answers after submission."
          confirmLabel="Submit"
          pending={pending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSubmit}
        />
      </div>
    );
  }

  if (!section) return null;

  return (
    <form
      className="space-y-6"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        goReview();
      }}
    >
      <Panel className="p-4">
        <ApplicationProgress
          sections={sectionStatus}
          currentIndex={sectionIndex}
          completionPercent={completionPercent}
          savedAt={dirty ? null : savedAt}
        />
      </Panel>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Form sections">
        {schema.sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === sectionIndex}
            onClick={() => setSectionIndex(i)}
            className={`text-xs px-3 py-1.5 rounded-full border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
              i === sectionIndex
                ? "bg-fg text-accent-fg border-fg"
                : "border-border text-fg-muted"
            }`}
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      <Panel className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-medium">{section.title}</h2>
          {section.description ? (
            <p className="text-sm text-fg-muted mt-1">{section.description}</p>
          ) : null}
        </div>

        {section.fields
          .filter((f) => f.type !== "section" && isFieldVisible(f, answers))
          .map((field) => {
            if (field.type === "file") {
              return (
                <DocumentUploadField
                  key={field.key}
                  id={field.key}
                  label={field.label}
                  required={field.required}
                  help={field.helpText}
                  error={fieldErrors[field.key]}
                  fileName={docs[field.key]?.fileName || String(answers[field.key] ?? "")}
                  downloadHref={
                    docs[field.key]
                      ? `/api/uploads/${docs[field.key].storagePath.split("\\").join("/")}`
                      : null
                  }
                  disabled={readOnly}
                  pending={pending}
                  onUpload={(file) => onUpload(field.key, file)}
                />
              );
            }

            return (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required ? " *" : ""}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    disabled={readOnly}
                    value={String(answers[field.key] ?? "")}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(fieldErrors[field.key])}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  />
                ) : field.type === "select" ? (
                  <Select
                    id={field.key}
                    disabled={readOnly}
                    value={String(answers[field.key] ?? "")}
                    aria-invalid={Boolean(fieldErrors[field.key])}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {(field.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input
                      id={field.key}
                      type="checkbox"
                      disabled={readOnly}
                      checked={Boolean(answers[field.key])}
                      onChange={(e) => setValue(field.key, e.target.checked)}
                    />
                    {field.helpText ?? "Yes"}
                  </label>
                ) : (
                  <Input
                    id={field.key}
                    type={
                      field.type === "email"
                        ? "email"
                        : field.type === "date"
                          ? "date"
                          : field.type === "phone"
                            ? "tel"
                            : "text"
                    }
                    disabled={readOnly}
                    value={String(answers[field.key] ?? "")}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(fieldErrors[field.key])}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  />
                )}
                {field.helpText && field.type !== "checkbox" ? (
                  <p className="mt-1 text-xs text-fg-muted">{field.helpText}</p>
                ) : null}
                <FieldError>{fieldErrors[field.key]}</FieldError>
              </div>
            );
          })}
      </Panel>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={sectionIndex === 0}
          onClick={() => setSectionIndex((i) => Math.max(0, i - 1))}
        >
          Previous
        </Button>
        {sectionIndex < schema.sections.length - 1 ? (
          <Button
            type="button"
            onClick={() => {
              if (!readOnly && !validateCurrentSection()) {
                toast({
                  title: "Complete this section",
                  description: "Fill required fields before continuing.",
                  tone: "danger",
                });
                return;
              }
              setSectionIndex((i) => Math.min(schema.sections.length - 1, i + 1));
            }}
          >
            Next section
          </Button>
        ) : !readOnly ? (
          <Button type="submit">Review & submit</Button>
        ) : null}
        {!readOnly ? (
          <Button type="button" variant="secondary" loading={pending} onClick={saveDraft}>
            Save draft
          </Button>
        ) : null}
      </div>
    </form>
  );
}
