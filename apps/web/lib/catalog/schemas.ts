import { DegreeLevel, ProgramStatus } from "@prisma/client";
import { z } from "zod";
import { PROGRAM_CATEGORIES } from "@/lib/programs/categories";

const categoryValues = PROGRAM_CATEGORIES.map((c) => c.value) as [
  (typeof PROGRAM_CATEGORIES)[number]["value"],
  ...(typeof PROGRAM_CATEGORIES)[number]["value"][],
];

export const catalogCourseWriteSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case")
    .optional(),
  category: z.enum(categoryValues),
  degreeLevel: z.nativeEnum(DegreeLevel),
  summary: z.string().trim().max(5000).optional().nullable(),
  eligibilitySummary: z.string().trim().max(2000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  price: z.number().nonnegative().optional().nullable(),
  tuitionCurrency: z.string().trim().min(3).max(3).optional(),
  capacity: z.number().int().positive().optional().nullable(),
  applicationFee: z.number().nonnegative().optional().nullable(),
  campusId: z.string().min(1).optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
  formDefinitionId: z.string().min(1).optional().nullable(),
  requiredDocs: z.array(z.string().trim().min(1)).optional(),
  crmCatalogId: z.string().trim().max(120).optional().nullable(),
  requiresCrmCallback: z.boolean().optional(),
  learningOutcomes: z.array(z.string().trim().min(1)).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  duration: z.string().trim().max(80).optional().nullable(),
  brochureUrl: z.string().url().optional().nullable().or(z.literal("")),
  status: z.nativeEnum(ProgramStatus).optional(),
});

export const catalogCoursePatchSchema = catalogCourseWriteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field is required" },
);

export const catalogStatusSchema = z.object({
  status: z.nativeEnum(ProgramStatus),
});

export type CatalogCourseWrite = z.infer<typeof catalogCourseWriteSchema>;
export type CatalogCoursePatch = z.infer<typeof catalogCoursePatchSchema>;
