"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FieldType, FormField, FormSchema, FormSection } from "@/lib/forms/schema";
import { fieldTypes } from "@/lib/forms/schema";
import { publishFormVersion, saveFormDraft } from "@/lib/actions/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

function newField(type: FieldType = "text"): FormField {
  const key = `field_${Math.random().toString(36).slice(2, 8)}`;
  return {
    key,
    type,
    label: type === "section" ? "Section label" : "New field",
    required: false,
    options:
      type === "select"
        ? [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ]
        : undefined,
  };
}

export function FormBuilder({
  formId,
  name,
  description,
  initialSchema,
  version,
  isPublished,
}: {
  formId: string;
  name: string;
  description: string | null;
  initialSchema: FormSchema;
  version: number;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [schema, setSchema] = useState<FormSchema>(initialSchema);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<{
    sectionId: string;
    fieldKey: string;
  } | null>(
    schema.sections[0]?.fields[0]
      ? { sectionId: schema.sections[0].id, fieldKey: schema.sections[0].fields[0].key }
      : null,
  );

  const selectedField = useMemo(() => {
    if (!selected) return null;
    const section = schema.sections.find((s) => s.id === selected.sectionId);
    const field = section?.fields.find((f) => f.key === selected.fieldKey);
    return section && field ? { section, field } : null;
  }, [schema, selected]);

  function updateSection(sectionId: string, updater: (s: FormSection) => FormSection) {
    setSchema((prev) => ({
      sections: prev.sections.map((s) => (s.id === sectionId ? updater(s) : s)),
    }));
  }

  function updateField(sectionId: string, fieldKey: string, patch: Partial<FormField>) {
    updateSection(sectionId, (section) => ({
      ...section,
      fields: section.fields.map((f) => (f.key === fieldKey ? { ...f, ...patch } : f)),
    }));
  }

  function addSection() {
    const id = `section_${Math.random().toString(36).slice(2, 8)}`;
    setSchema((prev) => ({
      sections: [
        ...prev.sections,
        { id, title: "New section", description: "", fields: [newField("text")] },
      ],
    }));
  }

  function addField(sectionId: string, type: FieldType) {
    const field = newField(type);
    updateSection(sectionId, (s) => ({ ...s, fields: [...s.fields, field] }));
    setSelected({ sectionId, fieldKey: field.key });
  }

  function removeField(sectionId: string, fieldKey: string) {
    updateSection(sectionId, (s) => ({
      ...s,
      fields: s.fields.filter((f) => f.key !== fieldKey),
    }));
    setSelected(null);
  }

  function save() {
    startTransition(async () => {
      const result = await saveFormDraft(formId, JSON.stringify(schema));
      setMessage(result.error ? result.error : "Draft saved");
      router.refresh();
    });
  }

  function publish() {
    startTransition(async () => {
      const saveResult = await saveFormDraft(formId, JSON.stringify(schema));
      if (saveResult.error) {
        setMessage(saveResult.error);
        return;
      }
      const result = await publishFormVersion(formId);
      setMessage(result.error ? result.error : "Version published");
      router.refresh();
    });
  }

  const allFieldKeys = schema.sections.flatMap((s) => s.fields.map((f) => f.key));

  return (
    <div>
      <PageHeader
        title={name}
        description={description ?? "Dynamic application form"}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save} loading={pending}>
              Save draft
            </Button>
            <Button onClick={publish} loading={pending}>
              Publish version
            </Button>
          </div>
        }
      />
      <div className="flex items-center gap-2 mb-4">
        <Badge tone={isPublished ? "success" : "warning"}>
          v{version} · {isPublished ? "published" : "draft"}
        </Badge>
        {message ? <span className="text-xs text-fg-muted">{message}</span> : null}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Panel className="lg:col-span-3 p-5 space-y-6">
          {schema.sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div>
                <Input
                  value={section.title}
                  onChange={(e) =>
                    updateSection(section.id, (s) => ({ ...s, title: e.target.value }))
                  }
                  className="font-medium"
                />
                <Textarea
                  className="mt-2"
                  value={section.description ?? ""}
                  placeholder="Section description"
                  onChange={(e) =>
                    updateSection(section.id, (s) => ({
                      ...s,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <ul className="space-y-2">
                {section.fields.map((field) => {
                  const active =
                    selected?.sectionId === section.id &&
                    selected?.fieldKey === field.key;
                  return (
                    <li key={field.key}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected({ sectionId: section.id, fieldKey: field.key })
                        }
                        className={`w-full text-left rounded-[var(--radius-sm)] border px-3 py-2 ${
                          active
                            ? "border-fg bg-bg"
                            : "border-border hover:border-border-strong"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          <span className="text-[11px] text-fg-muted uppercase">
                            {field.type}
                            {field.required ? " · req" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-fg-muted mt-0.5">{field.key}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Select
                  defaultValue="text"
                  onChange={(e) => addField(section.id, e.target.value as FieldType)}
                  className="w-auto"
                >
                  {fieldTypes
                    .filter((t) => t !== "section")
                    .map((t) => (
                      <option key={t} value={t}>
                        Add {t}
                      </option>
                    ))}
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addField(section.id, "text")}
                >
                  + Field
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addSection}>
            Add section
          </Button>
        </Panel>

        <Panel className="lg:col-span-2 p-5">
          <h2 className="text-sm font-medium mb-4">Field settings</h2>
          {!selectedField ? (
            <p className="text-sm text-fg-muted">Select a field to edit.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input
                  value={selectedField.field.label}
                  onChange={(e) =>
                    updateField(selectedField.section.id, selectedField.field.key, {
                      label: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Key</Label>
                <Input
                  value={selectedField.field.key}
                  onChange={(e) =>
                    updateField(selectedField.section.id, selectedField.field.key, {
                      key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
                    })
                  }
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={selectedField.field.type}
                  onChange={(e) =>
                    updateField(selectedField.section.id, selectedField.field.key, {
                      type: e.target.value as FieldType,
                      options:
                        e.target.value === "select"
                          ? selectedField.field.options ?? [
                              { label: "Option A", value: "a" },
                            ]
                          : undefined,
                    })
                  }
                >
                  {fieldTypes
                    .filter((t) => t !== "section")
                    .map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedField.field.required}
                  onChange={(e) =>
                    updateField(selectedField.section.id, selectedField.field.key, {
                      required: e.target.checked,
                    })
                  }
                />
                Required
              </label>
              <div>
                <Label>Placeholder</Label>
                <Input
                  value={selectedField.field.placeholder ?? ""}
                  onChange={(e) =>
                    updateField(selectedField.section.id, selectedField.field.key, {
                      placeholder: e.target.value,
                    })
                  }
                />
              </div>
              {selectedField.field.type === "select" ? (
                <div>
                  <Label>Options (label:value per line)</Label>
                  <Textarea
                    value={(selectedField.field.options ?? [])
                      .map((o) => `${o.label}:${o.value}`)
                      .join("\n")}
                    onChange={(e) =>
                      updateField(selectedField.section.id, selectedField.field.key, {
                        options: e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [label, value] = line.split(":");
                            return {
                              label: (label ?? "").trim(),
                              value: (value ?? label ?? "").trim(),
                            };
                          }),
                      })
                    }
                  />
                </div>
              ) : null}
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                  Conditional visibility
                </p>
                <div>
                  <Label>Show if field</Label>
                  <Select
                    value={selectedField.field.showIf?.fieldKey ?? ""}
                    onChange={(e) => {
                      const fieldKey = e.target.value;
                      if (!fieldKey) {
                        updateField(selectedField.section.id, selectedField.field.key, {
                          showIf: undefined,
                        });
                        return;
                      }
                      updateField(selectedField.section.id, selectedField.field.key, {
                        showIf: {
                          fieldKey,
                          equals: selectedField.field.showIf?.equals ?? true,
                        },
                      });
                    }}
                  >
                    <option value="">Always visible</option>
                    {allFieldKeys
                      .filter((k) => k !== selectedField.field.key)
                      .map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                  </Select>
                </div>
                {selectedField.field.showIf ? (
                  <div>
                    <Label>Equals</Label>
                    <Input
                      value={String(selectedField.field.showIf.equals)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const equals =
                          raw === "true" ? true : raw === "false" ? false : raw;
                        updateField(selectedField.section.id, selectedField.field.key, {
                          showIf: {
                            fieldKey: selectedField.field.showIf!.fieldKey,
                            equals,
                          },
                        });
                      }}
                      placeholder="true / false / value"
                    />
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() =>
                  removeField(selectedField.section.id, selectedField.field.key)
                }
              >
                Remove field
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
