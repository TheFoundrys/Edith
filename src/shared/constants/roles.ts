export type AppRole =
  | "SUPER_ADMIN"
  | "ADMISSIONS_MANAGER"
  | "COUNSELOR"
  | "CONTENT_UPLOADER"
  | "STUDENT";

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Admin",
  ADMISSIONS_MANAGER: "Admissions admin",
  COUNSELOR: "Counsellor",
  CONTENT_UPLOADER: "Content uploader",
  STUDENT: "Student",
};

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
  return !!role && (Object.keys(ROLE_LABELS) as string[]).includes(role);
}

export function capabilitiesFor(role: string | undefined | null): Capability[] {
  if (!isAppRole(role)) return [];
  return [...ROLE_CAPABILITIES[role]];
}

export function can(role: string | undefined | null, capability: Capability): boolean {
  return capabilitiesFor(role).includes(capability);
}

export type StaffNavItem = {
  href: string;
  label: string;
  anyOf?: Capability[];
};

export const STAFF_NAV: StaffNavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/programs", label: "Programs", anyOf: ["managePrograms", "managePricing"] },
  { href: "/admin/syllabus", label: "Syllabus", anyOf: ["manageContent"] },
  { href: "/admin/assignments", label: "Assignments", anyOf: ["manageContent"] },
  { href: "/admin/quizzes", label: "Quizzes", anyOf: ["manageContent"] },
  { href: "/admin/announcements", label: "Announcements", anyOf: ["manageContent"] },
  { href: "/admin/email-templates", label: "Email templates", anyOf: ["manageContent"] },
  { href: "/admin/forums", label: "Forums", anyOf: ["manageContent"] },
  { href: "/admin/badges", label: "Badges", anyOf: ["manageContent"] },
  { href: "/admin/coupons", label: "Coupons", anyOf: ["managePricing"] },
  { href: "/admin/offers", label: "Offers", anyOf: ["managePricing"] },
  { href: "/admin/payment-settings", label: "Payment settings", anyOf: ["managePricing"] },
  { href: "/admin/plugins/ai", label: "AI plugins", anyOf: ["manageAiPlugins"] },
  { href: "/admin/forms", label: "Forms", anyOf: ["manageForms"] },
  { href: "/admin/applications", label: "Applications", anyOf: ["manageApplications"] },
  { href: "/admin/tickets", label: "Tickets", anyOf: ["manageApplications"] },
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

export const STUDENT_NAV = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/my-courses", label: "My courses" },
  { href: "/student/programs", label: "Programs" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/assignments", label: "Assignments" },
  { href: "/student/quizzes", label: "Quizzes" },
  { href: "/student/announcements", label: "Announcements" },
  { href: "/student/forums", label: "Forums" },
  { href: "/student/tickets", label: "Tickets" },
  { href: "/student/certificates", label: "Certificates" },
  { href: "/student/profile", label: "Profile" },
  { href: "/student/settings", label: "Settings" },
] as const;
