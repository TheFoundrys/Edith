import { redirect } from "next/navigation";
import { crmApplicationsHref } from "@/lib/crm/urls";

export default function AdminApplicationsPage() {
  redirect(crmApplicationsHref());
}
