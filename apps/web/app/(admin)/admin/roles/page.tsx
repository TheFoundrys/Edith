import { redirect } from "next/navigation";
import { isSuperAdmin, requireCapability } from "@/lib/auth/session";

/** Legacy route — roles now live under Members → Roles & access (admin only). */
export default async function AdminRolesPage() {
  const session = await requireCapability("manageMembers");
  if (!isSuperAdmin(session.user.role)) {
    redirect("/admin/members");
  }
  redirect("/admin/members/roles");
}
