import { notFound, redirect } from "next/navigation";
import { requireCapability } from "@/lib/auth/session";
import { crmApplicationsHref } from "@/lib/crm/urls";
import { prisma } from "@/lib/db";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageApplications");
  const application = await prisma.application.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { crmApplicationId: true },
  });
  if (!application) notFound();
  redirect(crmApplicationsHref(application.crmApplicationId));
}
