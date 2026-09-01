/** Safe post-auth destinations for students and staff. */
import { isStaffRole } from "@/lib/auth/roles";
import { ROUTES, STUDENT_CALLBACK_PREFIXES, STAFF_CALLBACK_PREFIX } from "@/lib/urls";

export function resolveAuthRedirect(
  role: string | undefined | null,
  callbackUrl: string | null | undefined,
): string {
  const isStaff = isStaffRole(role);
  const home = isStaff ? ROUTES.admin : ROUTES.studentDashboard;

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return home;
  }

  // Block open redirects to other origins via protocol-relative or scheme URLs.
  if (callbackUrl.includes("://")) return home;

  if (isStaff) {
    return callbackUrl.startsWith(STAFF_CALLBACK_PREFIX) ? callbackUrl : home;
  }

  const studentAllowed = STUDENT_CALLBACK_PREFIXES.some((prefix) =>
    callbackUrl.startsWith(prefix),
  );

  return studentAllowed ? callbackUrl : home;
}
