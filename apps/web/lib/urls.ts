/**
 * Environment-aware URL helpers. Prefer these over hardcoded origins/paths.
 */

const TRAILING_SLASH = /\/$/;

/** Canonical public site origin (no trailing slash). */
export function getSiteOrigin(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";
  return raw.replace(TRAILING_SLASH, "");
}

/** @deprecated Use getSiteOrigin — kept for existing imports. */
export function publicAppOrigin(): string {
  return getSiteOrigin();
}

/** Build an absolute URL from a root-relative path. */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const origin = getSiteOrigin();
  return origin ? `${origin}${normalized}` : normalized;
}

/** Uploads served by `/api/uploads/*`. */
export function uploadUrl(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `/api/uploads/${normalized}`;
}

/** Named application routes (root-relative). */
export const ROUTES = {
  home: "/",
  courses: "/courses",
  course: (slug: string) => `/courses/${slug}`,
  courseIntakes: (slug: string) => `/courses/${slug}/intakes`,
  personalityProfile: "/personality-profile",
  login: "/login",
  admin: "/admin",
  adminMembers: "/admin/members",
  adminPrograms: "/admin/programs",
  adminEnrollments: "/admin/enrollments",
  adminPayments: "/admin/payments",
  adminPaymentSettings: "/admin/payment-settings",
  studentDashboard: "/student/dashboard",
  studentPayment: "/student/payment",
  studentInvoice: (paymentId: string) => `/student/payment/invoices/${paymentId}`,
  adminInvoice: (paymentId: string) => `/admin/payments/invoices/${paymentId}`,
  paymentSuccess: "/payment/success",
} as const;

/** Post-login callback paths allowed for students. */
export const STUDENT_CALLBACK_PREFIXES = [
  "/student",
  "/enroll",
  "/checkout",
  "/payment/",
  "/courses",
  "/personality-profile",
  "/verify/",
  "/invite/",
] as const;

/** Post-login callback paths allowed for staff. */
export const STAFF_CALLBACK_PREFIX = "/admin";
