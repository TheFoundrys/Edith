import type {
  CourseLevel,
  CourseType,
  DegreeLevel,
  EnrollmentStatus,
  ProgramCategory,
  ProgramKind,
  ProgramStatus,
} from "@prisma/client";

/** Edith-shaped program DTO backed by Compass `Course`. */
export type CompassProgramView = {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  description: string | null;
  eligibilitySummary: string | null;
  imageUrl: string | null;
  price: number | null;
  tuitionCurrency: string;
  status: ProgramStatus;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  programKind: ProgramKind;
  requiresCrmCallback: boolean;
  formDefinitionId: string | null;
  capacity: number | null;
  domainSlug: string | null;
  sku: string | null;
  level: CourseLevel | null;
  duration: string | null;
  learningOutcomes: string[];
  tags: string[];
  type: CourseType | null;
  isHybridOnly: boolean;
  intakes: [];
};

export type CompassEnrollmentView = {
  id: string;
  userId: string;
  programId: string;
  organizationId: string;
  status: EnrollmentStatus;
  enrolledAt: Date | null;
  createdAt: Date;
  amountPaid: number;
  payments: { status: string }[];
};

export type CompassLessonView = {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  summary: string | null;
  contentType: string;
  contentBody: string;
  durationMin: number | null;
  order: number;
  isPublished: boolean;
};

export type CompassModuleView = {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  duration: string | null;
  lessons: CompassLessonView[];
};
