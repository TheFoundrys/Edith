/**
 * Environment-aware URL helpers. Prefer these over hardcoded origins/paths.
 */

const TRAILING_SLASH = /\/$/;
const BIND_ALL_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

/** Canonical public site origin (no trailing slash). */
export function getSiteOrigin(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";
  return raw.replace(TRAILING_SLASH, "");
}

function firstHeader(value: string | null | undefined): string {
  return value?.split(",")[0]?.trim() ?? "";
}

/** Hostname from a Host / X-Forwarded-Host value (`0.0.0.0:3059` → `0.0.0.0`). */
export function headerHostname(hostHeader: string): string {
  const host = firstHeader(hostHeader);
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return (end === -1 ? host.slice(1) : host.slice(1, end)).toLowerCase();
  }
  return host.split(":")[0]!.toLowerCase();
}

export function isBindAllHost(hostHeader: string | null | undefined): boolean {
  if (!hostHeader?.trim()) return false;
  return BIND_ALL_HOSTS.has(headerHostname(hostHeader));
}

function usableConfiguredOrigin(): string {
  const raw = getSiteOrigin();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (BIND_ALL_HOSTS.has(url.hostname.toLowerCase())) return "";
    return url.origin;
  } catch {
    return "";
  }
}

/**
 * Origin for redirects. Next.js standalone sets HOSTNAME=0.0.0.0 so
 * `request.url` / `nextUrl.origin` are not safe to send to a browser.
 */
export function publicRequestOrigin(request: {
  url: string;
  headers: { get(name: string): string | null };
}): string {
  const configured = usableConfiguredOrigin();
  const host =
    firstHeader(request.headers.get("x-forwarded-host")) ||
    firstHeader(request.headers.get("host"));

  if (host && !isBindAllHost(host)) {
    if (configured) {
      const configuredHost = new URL(configured).hostname.toLowerCase();
      if (headerHostname(host) === configuredHost) return configured;
    }
    const proto =
      firstHeader(request.headers.get("x-forwarded-proto")) ||
      (() => {
        try {
          return new URL(request.url).protocol.replace(":", "") || "";
        } catch {
          return "";
        }
      })() ||
      (configured.startsWith("https://") ? "https" : "http");
    return `${proto}://${host}`;
  }

  if (configured) return configured;
  return `http://localhost:${process.env.PORT || "3059"}`;
}

/** Absolute URL for a same-origin redirect that will not leak 0.0.0.0. */
export function publicRequestUrl(
  request: { url: string; headers: { get(name: string): string | null } },
  path: string,
): URL {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${publicRequestOrigin(request)}/`);
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
