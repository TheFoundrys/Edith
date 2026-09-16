import { notFound, redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth/session";
import { crmApplicationsHref, crmApplyHref } from "@/lib/crm/urls";
import { prisma } from "@/lib/db";

export default async function StudentApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStudent();
  const application = await prisma.application.findFirst({
    where: {
      id,
      applicantId: session.user.id,
      organizationId: session.user.organizationId,
    },
    select: {
      crmApplicationId: true,
      program: { select: { slug: true } },
    },
  });
  if (!application) notFound();
  redirect(
    application.crmApplicationId
      ? crmApplicationsHref(application.crmApplicationId)
      : crmApplyHref({ programSlug: application.program.slug }),
  );
}
