import type { AppRole } from "@/lib/auth/roles";

/** Map Compass `User.role` text to Edith staff/student roles. */
export function compassRoleToAppRole(raw: string | null | undefined): AppRole {
  const role = (raw ?? "learner").trim().toLowerCase();
  if (role === "learner" || role === "student") return "STUDENT";
  if (role === "admin" || role.includes("super")) return "SUPER_ADMIN";
  if (role.includes("content")) return "CONTENT_UPLOADER";
  if (role.includes("bursar") || role.includes("finance")) return "BURSAR";
  if (
    role.includes("admission") ||
    role.includes("dean") ||
    role.includes("moderator")
  ) {
    return "ADMISSIONS_MANAGER";
  }
  if (role.includes("support") || role.includes("counsel")) return "COUNSELOR";
  return "STUDENT";
}
