import {
  ALL_CAPABILITIES,
  ROLE_LABELS,
  STAFF_MATRIX_ROLES,
  STAFF_PERMISSION_ROLES,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  managePricing: "Pricing & fees",
  managePrograms: "Programs catalog",
  manageContent: "Syllabus, assignments, quizzes",
  manageApplications: "Applications & counselling",
  manageForms: "Application forms",
  manageAiPlugins: "AI plugins",
  manageMembers: "Members & access",
  learnAsStudent: "Student learning",
};

export { ALL_CAPABILITIES, ROLE_LABELS, STAFF_MATRIX_ROLES, STAFF_PERMISSION_ROLES };
export type { AppRole, Capability };
