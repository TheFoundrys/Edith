import { redirect } from "next/navigation";
import { crmApplyHref } from "@/lib/crm/urls";

export default async function StudentApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const { program } = await searchParams;
  redirect(crmApplyHref({ programSlug: program }));
}
