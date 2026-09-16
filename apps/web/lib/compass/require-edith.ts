import "server-only";

import { isCompassDatabase } from "@/lib/db/profile";
import { redirect } from "next/navigation";

/** Redirect compass_dev sessions away from Edith-only admin routes. */
export function redirectIfCompassAdminRoute() {
  if (isCompassDatabase()) redirect("/admin");
}
