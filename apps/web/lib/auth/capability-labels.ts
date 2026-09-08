import {
  ALL_CAPABILITIES,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  STAFF_MATRIX_ROLES,
  STAFF_PERMISSION_ROLES,
  type AppRole,
  type Capability,
} from "@/lib/auth/roles";

export const CAPABILITY_LABELS: Record<Capability, string> = {
  managePricing: "Tuition, scholarships & refunds",
  managePrograms: "Courses & degree catalog",
  manageContent: "Syllabi, curriculum & exams",
  manageApplications: "Student admissions & intakes",
  manageForms: "Application forms",
  manageAiPlugins: "System configuration & keys",
  manageMembers: "Faculty staff allocation & access",
  learnAsStudent: "Student learning",
};

export const CAPABILITY_GROUPS: { label: string; capabilities: Capability[] }[] = [
  {
    label: "Core Platform & Dashboards",
    capabilities: ["manageAiPlugins"],
  },
  {
    label: "Academic Operations",
    capabilities: [
      "managePrograms",
      "manageContent",
      "manageApplications",
      "manageForms",
    ],
  },
  {
    label: "Financial & Bursar Operations",
    capabilities: ["managePricing"],
  },
  {
    label: "Faculty & Staff Administration",
    capabilities: ["manageMembers"],
  },
];

export {
  ALL_CAPABILITIES,
  ROLE_LABELS,
  ROLE_SHORT_LABELS,
  STAFF_MATRIX_ROLES,
  STAFF_PERMISSION_ROLES,
};
export type { AppRole, Capability };
