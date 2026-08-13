import type {
  Campus,
  DegreeLevel,
  Department,
  Intake,
  Program,
  ProgramCategory,
  ProgramStatus,
  ProgramSyllabus,
  SyllabusLesson,
  SyllabusModule,
} from "@prisma/client";
import {
  PROGRAM_CATEGORIES,
  displayProgramName,
  programCategoryLabel,
} from "@/lib/programs/categories";
import {
  catalogDurationKey,
  catalogDurationLabel,
  catalogExperienceKey,
  catalogExperienceLabel,
  catalogMode,
} from "@/lib/programs/catalog-meta";

type CatalogBase = Pick<
  Program,
  | "id"
  | "title"
  | "slug"
  | "category"
  | "degreeLevel"
  | "description"
  | "eligibilitySummary"
  | "imageUrl"
  | "price"
  | "tuitionCurrency"
  | "applicationFee"
  | "programKind"
  | "tags"
  | "level"
  | "duration"
  | "learningOutcomes"
  | "brochureUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
> & {
  campus: Pick<Campus, "id" | "name"> | null;
  department: Pick<Department, "id" | "name"> | null;
  intakes?: Pick<Intake, "id" | "name" | "startDate" | "applicationOpen" | "applicationClose" | "capacity" | "isActive">[];
};

type SyllabusOutline = Pick<ProgramSyllabus, "id" | "title" | "description" | "status"> & {
  modules: (Pick<SyllabusModule, "id" | "title" | "summary" | "order" | "duration"> & {
    lessons: Pick<
      SyllabusLesson,
      "id" | "title" | "summary" | "durationMin" | "order" | "isPreview" | "isFree"
    >[];
  })[];
};

function feeLabel(
  price: number | null,
  tuitionCurrency: string,
): string {
  if (price == null) return "Contact Admissions";
  if (price === 0) return "Free";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: tuitionCurrency || "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function catalogMeta(program: {
  title: string;
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  eligibilitySummary: string | null;
  campus: { name: string } | null;
}) {
  return {
    mode: catalogMode(program),
    duration: catalogDurationLabel(program),
    durationKey: catalogDurationKey(program),
    experienceLabel: catalogExperienceLabel(program),
    experienceKey: catalogExperienceKey(program),
    suiteLabel: programCategoryLabel(program.category),
    displayName: displayProgramName(program.title, program.category),
  };
}

export function serializeCatalogCourse(program: CatalogBase) {
  const meta = catalogMeta(program);
  return {
    id: program.id,
    name: program.title,
    displayName: meta.displayName,
    slug: program.slug,
    category: program.category,
    suiteLabel: meta.suiteLabel,
    degreeLevel: program.degreeLevel,
    summary: program.description,
    eligibilitySummary: program.eligibilitySummary,
    imageUrl: program.imageUrl,
    price: program.price,
    tuitionCurrency: program.tuitionCurrency,
    applicationFee: program.applicationFee,
    feeLabel: feeLabel(program.price, program.tuitionCurrency),
    programKind: program.programKind,
    tags: program.tags,
    level: program.level,
    duration: program.duration,
    learningOutcomes: program.learningOutcomes,
    brochureUrl: program.brochureUrl,
    status: program.status,
    publishedAt: program.publishedAt,
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
    campus: program.campus,
    department: program.department,
    intakes: (program.intakes ?? []).map((intake) => ({
      id: intake.id,
      name: intake.name,
      startDate: intake.startDate,
      applicationOpen: intake.applicationOpen,
      applicationClose: intake.applicationClose,
      capacity: intake.capacity,
      isActive: intake.isActive,
    })),
    meta: {
      mode: meta.mode,
      duration: meta.duration,
      durationKey: meta.durationKey,
      experienceLabel: meta.experienceLabel,
      experienceKey: meta.experienceKey,
    },
    href: `/courses/${program.slug}`,
  };
}

export function serializeCatalogCourseDetail(
  program: CatalogBase & { syllabus: SyllabusOutline | null },
) {
  return {
    ...serializeCatalogCourse(program),
    syllabus: program.syllabus
      ? {
          id: program.syllabus.id,
          title: program.syllabus.title,
          description: program.syllabus.description,
          status: program.syllabus.status,
          modules: program.syllabus.modules.map((mod) => ({
            id: mod.id,
            title: mod.title,
            summary: mod.summary,
            sortOrder: mod.order,
            duration: mod.duration,
            lessons: mod.lessons.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              summary: lesson.summary,
              durationMin: lesson.durationMin,
              sortOrder: lesson.order,
              isPreview: lesson.isPreview,
              isFree: lesson.isFree,
            })),
          })),
        }
      : null,
  };
}

type AdminExtras = {
  _count?: { applications: number; enrollments: number };
  formDefinitionId?: string | null;
  crmCatalogId?: string | null;
  requiresCrmCallback?: boolean;
  capacity?: number | null;
};

function adminFields(program: AdminExtras) {
  return {
    formDefinitionId: program.formDefinitionId ?? null,
    crmCatalogId: program.crmCatalogId ?? null,
    requiresCrmCallback: program.requiresCrmCallback ?? false,
    capacity: program.capacity ?? null,
    counts: program._count ?? { applications: 0, enrollments: 0 },
  };
}

export function serializeAdminCourse(program: CatalogBase & AdminExtras) {
  return {
    ...serializeCatalogCourse(program),
    ...adminFields(program),
  };
}

export function serializeAdminCourseDetail(
  program: CatalogBase & AdminExtras & { syllabus: SyllabusOutline | null },
) {
  return {
    ...serializeCatalogCourseDetail(program),
    ...adminFields(program),
  };
}

export function serializeCategories() {
  return PROGRAM_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
    shortLabel: c.shortLabel,
    description: c.description,
  }));
}

export type SerializedCatalogCourse = ReturnType<typeof serializeCatalogCourse>;
export type CatalogCourseStatus = ProgramStatus;
