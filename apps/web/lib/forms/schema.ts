import { z } from "zod";

export const fieldTypes = [
  "text",
  "email",
  "phone",
  "select",
  "date",
  "file",
  "textarea",
  "checkbox",
  "section",
] as const;

export type FieldType = (typeof fieldTypes)[number];

export const conditionSchema = z.object({
  fieldKey: z.string(),
  equals: z.union([z.string(), z.boolean(), z.number()]),
});

export type FieldCondition = z.infer<typeof conditionSchema>;

export const formFieldSchema = z.object({
  key: z.string().min(1),
  type: z.enum(fieldTypes),
  label: z.string().min(1),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  showIf: conditionSchema.optional(),
});

export type FormField = z.infer<typeof formFieldSchema>;

export const formSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema),
});

export type FormSection = z.infer<typeof formSectionSchema>;

export const formSchemaSchema = z.object({
  sections: z.array(formSectionSchema),
});

export type FormSchema = z.infer<typeof formSchemaSchema>;

export function parseFormSchema(json: string): FormSchema {
  const raw = JSON.parse(json) as unknown;
  return formSchemaSchema.parse(raw);
}

export function emptyFormSchema(): FormSchema {
  return {
    sections: [
      {
        id: "personal",
        title: "Personal information",
        description: "Basic applicant details",
        fields: [
          {
            key: "full_name",
            type: "text",
            label: "Full name",
            required: true,
            placeholder: "As on passport",
          },
          {
            key: "email",
            type: "email",
            label: "Email",
            required: true,
          },
          {
            key: "phone",
            type: "phone",
            label: "Phone",
            required: true,
          },
        ],
      },
    ],
  };
}

export function isFieldVisible(
  field: FormField,
  answers: Record<string, unknown>,
): boolean {
  if (!field.showIf) return true;
  return answers[field.showIf.fieldKey] === field.showIf.equals;
}

export function validateAnswers(
  schema: FormSchema,
  answers: Record<string, unknown>,
): { ok: true } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type === "section") continue;
      if (!isFieldVisible(field, answers)) continue;
      if (!field.required) continue;

      const value = answers[field.key];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (field.type === "checkbox" && value !== true);

      if (empty) {
        errors[field.key] = `${field.label} is required`;
      }

      if (field.type === "email" && typeof value === "string" && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[field.key] = "Enter a valid email";
        }
      }
    }
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

export function visibleFields(schema: FormSchema, answers: Record<string, unknown>) {
  return schema.sections.flatMap((section) =>
    section.fields
      .filter((f) => f.type !== "section" && isFieldVisible(f, answers))
      .map((f) => ({ ...f, sectionId: section.id, sectionTitle: section.title })),
  );
}
