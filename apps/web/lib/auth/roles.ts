/** Edge-safe role helpers — do not import from `@prisma/client` (pulls Prisma into Edge). */

export type AppRole =
  | "SUPER_ADMIN"
  | "ADMISSIONS_MANAGER"
  | "BURSAR"
  | "COUNSELOR"
  | "CONTENT_UPLOADER"
  | "STUDENT";

/** Human labels for UI. Enum keys stay stable so existing memberships keep working. */
export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Administrator",
  ADMISSIONS_MANAGER: "Academic Dean / Head",
  BURSAR: "Bursar & Finance",
  COUNSELOR: "Admissions Staff",
  CONTENT_UPLOADER: "Lead Faculty / Teachers",
  STUDENT: "Student",
};

/** Shorter column headers for the permissions matrix. */
export const ROLE_SHORT_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMISSIONS_MANAGER: "Academic Dean",
  BURSAR: "Bursar & Finance",
  COUNSELOR: "Admissions Staff",
  CONTENT_UPLOADER: "Lead Faculty",
  STUDENT: "Student",
};

export type RoleAuthorityTone = "full" | "high" | "medium" | "limited" | "learner";

export type RoleProfile = {
  authority: string;
  authorityTone: RoleAuthorityTone;
  domain: string;
  /** Filled bars out of 4, matching the control-centre summary cards. */
  bars: 0 | 1 | 2 | 3 | 4;
  description: string;
};

export const ROLE_PROFILES: Record<AppRole, RoleProfile> = {
  SUPER_ADMIN: {
    authority: "Full",
    authorityTone: "full",
    domain: "Admin",
    bars: 4,
    description: "Institution-wide control, including system keys, audit, and staff access.",
  },
  ADMISSIONS_MANAGER: {
    authority: "High",
    authorityTone: "high",
    domain: "Academic",
    bars: 3,
    description: "Catalog, syllabi, admissions, exams, and faculty allocation. Fees stay with finance.",
  },
  BURSAR: {
    authority: "Medium",
    authorityTone: "medium",
    domain: "Finance",
    bars: 2,
    description: "Tuition invoicing, scholarships, concessions, refunds, and gateway reconciliation.",
  },
  COUNSELOR: {
    authority: "Tier 3",
    authorityTone: "medium",
    domain: "Intake",
    bars: 2,
    description: "Student admissions, intakes, applications, and counselling follow-ups.",
  },
  CONTENT_UPLOADER: {
    authority: "Tier 4",
    authorityTone: "limited",
    domain: "Faculty",
    bars: 1,
    description: "Course catalog, syllabi, curriculum publishing, and examination materials.",
  },
  STUDENT: {
    authority: "Learner",
    authorityTone: "learner",
    domain: "Learning",
    bars: 0,
    description: "Learning workspace only.",
  },
};

/**
 * Capability keys mapped to the control-centre modules.
 *
 * | Capability           | Super Admin | Academic Dean | Bursar | Admissions | Faculty | Student |
 * | -------------------- | ----------- | ------------- | ------ | ---------- | ------- | ------- |
 * | managePricing        | ✓           |               | ✓      |            |         |         |
 * | managePrograms       | ✓           | ✓             |        |            | ✓       |         |
 * | manageContent        | ✓           | ✓             |        |            | ✓       |         |
 * | manageApplications   | ✓           | ✓             |        | ✓          |         |         |
 * | manageForms          | ✓           | ✓             |        | ✓          |         |         |
 * | manageAiPlugins      | ✓           |               |        |            |         |         |
 * | manageMembers        | ✓           | ✓             |        |            |         |         |
 * | learnAsStudent       |             |               |        |            |         | ✓       |
 */
export type Capability =
  | "managePricing"
  | "managePrograms"
  | "manageContent"
  | "manageApplications"
  | "manageForms"
  | "manageAiPlugins"
  | "manageMembers"
  | "learnAsStudent";

const ROLE_CAPABILITIES: Record<AppRole, readonly Capability[]> = {
  SUPER_ADMIN: [
    "managePricing",
    "managePrograms",
    "manageContent",
    "manageApplications",
    "manageForms",
    "manageAiPlugins",
    "manageMembers",
  ],
  ADMISSIONS_MANAGER: [
    "managePrograms",
    "manageContent",
    "manageApplications",
    "manageForms",
    "manageMembers",
  ],
  BURSAR: ["managePricing"],
  COUNSELOR: ["manageApplications", "manageForms"],
  CONTENT_UPLOADER: ["managePrograms", "manageContent"],
  STUDENT: ["learnAsStudent"],
};

/** Default matrix — used until an org customises roles in admin. */
export const DEFAULT_ROLE_CAPABILITIES: Record<AppRole, Capability[]> = {
  SUPER_ADMIN: [...ROLE_CAPABILITIES.SUPER_ADMIN],
  ADMISSIONS_MANAGER: [...ROLE_CAPABILITIES.ADMISSIONS_MANAGER],
  BURSAR: [...ROLE_CAPABILITIES.BURSAR],
  COUNSELOR: [...ROLE_CAPABILITIES.COUNSELOR],
  CONTENT_UPLOADER: [...ROLE_CAPABILITIES.CONTENT_UPLOADER],
  STUDENT: [...ROLE_CAPABILITIES.STUDENT],
};

/** Maps staff access enum values to system PermissionRole slugs. */
export const ENUM_TO_PERMISSION_SLUG: Record<AppRole, string> = {
  SUPER_ADMIN: "administrator",
  ADMISSIONS_MANAGER: "admissions",
  BURSAR: "bursar",
  COUNSELOR: "counsellor",
  CONTENT_UPLOADER: "content-author",
  STUDENT: "member",
};

export const ALL_CAPABILITIES: Capability[] = [
  "managePricing",
  "managePrograms",
  "manageContent",
  "manageApplications",
  "manageForms",
  "manageAiPlugins",
  "manageMembers",
  "learnAsStudent",
];

export const STAFF_MATRIX_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
  "BURSAR",
  "COUNSELOR",
  "CONTENT_UPLOADER",
  "STUDENT",
];

/** Staff access levels shown in the permissions matrix (excludes student). */
export const STAFF_PERMISSION_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
  "BURSAR",
  "COUNSELOR",
  "CONTENT_UPLOADER",
];

export const STAFF_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
  "BURSAR",
  "COUNSELOR",
  "CONTENT_UPLOADER",
];

export function isStaffRole(role: string | undefined | null): role is AppRole {
  return !!role && (STAFF_ROLES as string[]).includes(role);
}

export function isAppRole(role: string | undefined | null): role is AppRole {
  return (
    !!role &&
    (Object.keys(ROLE_LABELS) as string[]).includes(role)
  );
}

export function roleLabel(role: string | undefined | null): string {
  if (isAppRole(role)) return ROLE_LABELS[role];
  return role?.replaceAll("_", " ") ?? "Unknown";
}

export function capabilitiesFor(role: string | undefined | null): Capability[] {
  if (!isAppRole(role)) return [];
  return [...ROLE_CAPABILITIES[role]];
}

export function can(role: string | undefined | null, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability);
}

/** Admin nav items filtered by role capabilities. */
export type StaffNavItem = {
  href: string;
  label: string;
  /** If set, user needs ANY of these capabilities. */
  anyOf?: Capability[];
};

export const STAFF_NAV: StaffNavItem[] = [
  { href: "/admin", label: "Overview" },
  {
    href: "/admin/programs",
    label: "Programs",
    anyOf: ["managePrograms", "managePricing"],
  },
  {
    href: "/admin/syllabus",
    label: "Syllabus",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/quizzes",
    label: "Quizzes",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/email-templates",
    label: "Email templates",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/forums",
    label: "Forums",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/badges",
    label: "Badges",
    anyOf: ["manageContent"],
  },
  {
    href: "/admin/coupons",
    label: "Coupons",
    anyOf: ["managePricing"],
  },
  {
    href: "/admin/offers",
    label: "Offers",
    anyOf: ["managePricing"],
  },
  {
    href: "/admin/plugins/ai",
    label: "AI plugins",
    anyOf: ["manageAiPlugins"],
  },
  {
    href: "/admin/forms",
    label: "Forms",
    anyOf: ["manageForms"],
  },
  {
    href: "/admin/applications",
    label: "Applications",
    anyOf: ["manageApplications"],
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    anyOf: ["manageApplications"],
  },
  {
    href: "/admin/personality-profile",
    label: "Personality Profile",
    anyOf: ["manageApplications"],
  },
  {
    href: "/admin/members",
    label: "Members",
    anyOf: ["manageMembers"],
  },
];

export function staffNavFor(
  role: string | undefined | null,
  hasCapability: (cap: Capability) => boolean = (cap) => can(role, cap),
): StaffNavItem[] {
  return STAFF_NAV.filter((item) => {
    if (!item.anyOf?.length) return true;
    return item.anyOf.some((c) => hasCapability(c));
  });
}
