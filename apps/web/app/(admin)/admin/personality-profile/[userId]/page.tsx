import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability } from "@/lib/auth/session";
import { getPersonalityTrainerDetail } from "@/lib/actions/personality-profile";
import { PersonalityReportView } from "@/components/student/personality-report";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { prisma } from "@/lib/db";
import { displayProgramName } from "@/lib/programs/categories";

export default async function AdminPersonalityDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireCapability("manageApplications");
  const { userId } = await params;
  const detail = await getPersonalityTrainerDetail(userId);
  if (!detail.ok) notFound();

  const slugs = detail.report?.recommendations.map((item) => item.slug) ?? [];
  const programs = slugs.length
    ? await prisma.program.findMany({
        where: {
          organizationId: session.user.organizationId,
          slug: { in: slugs },
          status: "PUBLISHED",
        },
        select: { slug: true, title: true, category: true },
      })
    : [];
  const titles = Object.fromEntries(
    programs.map((program) => [
      program.slug,
      displayProgramName(program.title, program.category),
    ]),
  );

  return (
    <div>
      <PageHeader
        title={detail.student.name}
        description={detail.student.email}
        actions={
          <Link href="/admin/personality-profile">
            <Button size="sm" variant="ghost">
              Roster
            </Button>
          </Link>
        }
      />
      <Panel className="mb-6 p-5">
        <h2 className="font-display text-xl">Trainer brief</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed">
          {detail.brief.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {detail.kyc?.resumeFileName ? (
          <p className="mt-4 text-xs text-fg-muted">
            Resume on file: {detail.kyc.resumeFileName}
            {detail.kyc.keywords.length
              ? ` · ${detail.kyc.keywords.join(", ")}`
              : ""}
          </p>
        ) : null}
      </Panel>
      {detail.report ? (
        <PersonalityReportView
          report={detail.report}
          titles={titles}
          rank={detail.rank}
        />
      ) : (
        <Panel className="p-5">
          <p className="text-sm text-fg-muted">Exam not submitted yet.</p>
        </Panel>
      )}
    </div>
  );
}
