/** Safe post-auth destinations for students and staff. */
export function resolveAuthRedirect(
  role: string | undefined | null,
  callbackUrl: string | null | undefined,
): string {
  const isStaff =
    role === "SUPER_ADMIN" ||
    role === "ADMISSIONS_MANAGER" ||
    role === "COUNSELOR";
  const home = isStaff ? "/admin" : "/student/dashboard";

  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return home;
  }

  // Block open redirects to other origins via protocol-relative or scheme URLs.
  if (callbackUrl.includes("://")) return home;

  if (isStaff) {
    return callbackUrl.startsWith("/admin") ? callbackUrl : home;
  }

  const studentAllowed =
    callbackUrl.startsWith("/student") ||
    callbackUrl.startsWith("/enroll") ||
    callbackUrl.startsWith("/checkout") ||
    callbackUrl.startsWith("/payment/") ||
    callbackUrl.startsWith("/courses");

  return studentAllowed ? callbackUrl : home;
}
