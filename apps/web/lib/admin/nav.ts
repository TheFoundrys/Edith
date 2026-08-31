import type { Capability } from "@/lib/auth/roles";
import { STAFF_NAV, type StaffNavItem } from "@/lib/auth/roles";

export type AdminNavItem = StaffNavItem & {
  requiresSuperAdmin?: boolean;
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
      { href: "/admin/members", label: "Members", anyOf: ["manageMembers"] },
      {
        href: "/admin/members/invites",
        label: "Staff invites",
        anyOf: ["manageMembers"],
      },
      {
        href: "/admin/members/groups",
        label: "Groups",
        anyOf: ["manageMembers"],
      },
      {
        href: "/admin/members/activity",
        label: "Activity",
        anyOf: ["manageMembers"],
      },
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
      { href: "/admin/syllabus", label: "Syllabus", anyOf: ["manageContent"] },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: "/admin/assignments", label: "Assignments", anyOf: ["manageContent"] },
      { href: "/admin/quizzes", label: "Quizzes", anyOf: ["manageContent"] },
      { href: "/admin/forums", label: "Forums", anyOf: ["manageContent"] },
      { href: "/admin/badges", label: "Badges", anyOf: ["manageContent"] },
    ],
  },
  {
    label: "Admissions",
    items: [
      { href: "/admin/applications", label: "Applications", anyOf: ["manageApplications"] },
      { href: "/admin/forms", label: "Forms", anyOf: ["manageForms"] },
      { href: "/admin/tickets", label: "Tickets", anyOf: ["manageApplications"] },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/admin/coupons", label: "Coupons", anyOf: ["managePricing"] },
      { href: "/admin/offers", label: "Offers", anyOf: ["managePricing"] },
      {
        href: "/admin/payment-settings",
        label: "Payments",
        anyOf: ["managePricing"],
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
