/** Edge-safe role helpers — do not import from `@prisma/client` (pulls Prisma into Edge). */

export type AppRole =
  | "SUPER_ADMIN"
  | "ADMISSIONS_MANAGER"
  | "COUNSELOR"
  | "CONTENT_UPLOADER"
  | "STUDENT";

/** Human labels for UI. */
export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Admin",
  ADMISSIONS_MANAGER: "Admissions admin",
  COUNSELOR: "Counsellor",
  CONTENT_UPLOADER: "Content uploader",
  STUDENT: "Student",
};

/**
 * Capability keys — keep pricing and commerce separate from content upload.
 *
 * | Capability           | Admin | Admissions | Counsellor | Content | Student |
 * | -------------------- | ----- | ---------- | ---------- | ------- | ------- |
 * | managePricing        | ✓     | ✓          |            |         |         |
 * | managePrograms       | ✓     | ✓          |            |         |         |
 * | manageContent        | ✓     |            |            | ✓       |         |
 * | manageApplications   | ✓     | ✓          | ✓          |         |         |
 * | manageForms          | ✓     | ✓          |            |         |         |
 * | manageAiPlugins      | ✓     |            |            |         |         |
 * | learnAsStudent       |       |            |            |         | ✓       |
 */
export type Capability =
  | "managePricing"
  | "managePrograms"
  | "manageContent"
  | "manageApplications"
  | "manageForms"
  | "manageAiPlugins"
  | "learnAsStudent";

const ROLE_CAPABILITIES: Record<AppRole, readonly Capability[]> = {
  SUPER_ADMIN: [
    "managePricing",
    "managePrograms",
    "manageContent",
    "manageApplications",
    "manageForms",
    "manageAiPlugins",
  ],
  ADMISSIONS_MANAGER: [
    "managePricing",
    "managePrograms",
    "manageApplications",
    "manageForms",
  ],
  COUNSELOR: ["manageApplications"],
  CONTENT_UPLOADER: ["manageContent"],
  STUDENT: ["learnAsStudent"],
};

export const STAFF_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMISSIONS_MANAGER",
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
    href: "/admin/payment-settings",
    label: "Payment settings",
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
    href: "/admin/roles",
    label: "Roles",
    anyOf: ["managePrograms", "manageContent", "manageApplications", "manageAiPlugins"],
  },
];

export function staffNavFor(role: string | undefined | null): StaffNavItem[] {
  return STAFF_NAV.filter((item) => {
    if (!item.anyOf?.length) return true;
    return item.anyOf.some((c) => can(role, c));
  });
}
