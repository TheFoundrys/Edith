import type { Capability } from "@/lib/auth/roles";
import { STAFF_NAV, type StaffNavItem } from "@/lib/auth/roles";
import {
  isEdithOnlyFeature,
  type EdithOnlyFeature,
} from "@/lib/compass/guards";

export type AdminNavItem = StaffNavItem & {
  requiresSuperAdmin?: boolean;
  /** Hidden on compass_dev (Edith-only tables). */
  edithOnly?: EdithOnlyFeature;
};

const EDITH_ONLY_HREFS: Partial<Record<string, EdithOnlyFeature>> = {
  "/admin/members": "members",
  "/admin/members/roles": "roles-matrix",
  "/admin/applications": "applications",
  "/admin/offers": "offers",
  "/admin/coupons": "coupons",
  "/admin/payment-settings": "payment-settings",
  "/admin/plugins/ai": "ai-plugins",
  "/admin/course-mcqs": "edith-mcq-admin",
  "/admin/quizzes": "edith-quizzes",
  "/admin/quizzes/new": "edith-quizzes",
  "/admin/lesson-mcqs": "edith-mcq-admin",
  "/admin/forms": "forms",
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "People",
    items: [
      { href: "/admin/members", label: "People", anyOf: ["manageMembers"] },
      {
        href: "/admin/members/roles",
        label: "Roles & access",
        requiresSuperAdmin: true,
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/programs",
        label: "Programs",
        anyOf: ["managePrograms", "managePricing"],
      },
      {
        href: "/admin/enrollments",
        label: "Enrollments",
        anyOf: ["managePrograms", "manageApplications"],
      },
      { href: "/admin/syllabus", label: "Syllabus", anyOf: ["manageContent"] },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/admin/assignments", label: "Assignments", anyOf: ["manageContent"] },
      { href: "/admin/quizzes", label: "Quizzes", anyOf: ["manageContent"] },
      { href: "/admin/course-mcqs", label: "Course MCQs", anyOf: ["manageContent"] },
      { href: "/admin/lesson-mcqs", label: "Lesson MCQs", anyOf: ["manageContent"] },
      { href: "/admin/forums", label: "Forums", anyOf: ["manageContent"] },
      { href: "/admin/badges", label: "Badges", anyOf: ["manageContent"] },
    ],
  },
  {
    label: "Admissions",
    items: [
      { href: "/admin/forms", label: "Forms", anyOf: ["manageForms"] },
      { href: "/admin/tickets", label: "Tickets", anyOf: ["manageApplications"] },
      {
        href: "/admin/personality-profile",
        label: "Profile intake",
        anyOf: ["manageApplications"],
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/coupons", label: "Coupons", anyOf: ["managePricing"] },
      { href: "/admin/offers", label: "Offers", anyOf: ["managePricing"] },
      {
        href: "/admin/transactions",
        label: "Transactions",
        anyOf: ["managePricing"],
      },
      {
        href: "/admin/payment-settings",
        label: "Payment settings",
        requiresSuperAdmin: true,
      },
    ],
  },
  {
    label: "Communications",
    items: [
      { href: "/admin/announcements", label: "Announcements", anyOf: ["manageContent"] },
      { href: "/admin/email-templates", label: "Email", anyOf: ["manageContent"] },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/admin/plugins/ai", label: "AI plugins", anyOf: ["manageAiPlugins"] },
    ],
  },
];

function itemVisible(
  item: AdminNavItem,
  hasCapability: (cap: Capability) => boolean,
  isSuperAdmin: boolean,
) {
  const edithOnly = item.edithOnly ?? EDITH_ONLY_HREFS[item.href];
  if (edithOnly && isEdithOnlyFeature(edithOnly)) return false;
  if (item.requiresSuperAdmin && !isSuperAdmin) return false;
  if (item.anyOf?.length && !item.anyOf.some((cap) => hasCapability(cap))) {
    return false;
  }
  return true;
}

/** Grouped admin sidebar — empty groups are omitted. */
export function adminNavGroupsFor(
  hasCapability: (cap: Capability) => boolean,
  isSuperAdmin = false,
): AdminNavGroup[] {
  return ADMIN_NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) =>
      itemVisible(item, hasCapability, isSuperAdmin),
    ),
  })).filter((group) => group.items.length > 0);
}

/** Flat admin nav — one link per route, filtered by org capabilities. */
export function adminNavFor(
  hasCapability: (cap: Capability) => boolean,
  isSuperAdmin = false,
): AdminNavItem[] {
  const seen = new Set<string>();
  const grouped = adminNavGroupsFor(hasCapability, isSuperAdmin);
  const items = grouped.flatMap((group) => group.items);

  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

/** Fallback flat list from STAFF_NAV when grouping is not used. */
export function staffNavFiltered(
  hasCapability: (cap: Capability) => boolean,
): StaffNavItem[] {
  return STAFF_NAV.filter((item) => {
    if (item.anyOf?.length && !item.anyOf.some((cap) => hasCapability(cap))) {
      return false;
    }
    return true;
  });
}
