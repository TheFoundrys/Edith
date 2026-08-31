import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonalityReportView } from "@/components/student/personality-report";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import { PERSONALITY_PROFILE_HREF } from "@/lib/assessments/personality-profile";
import { prisma } from "@/lib/db";
import { requireStudent } from "@/lib/auth/session";
import { displayProgramName } from "@/lib/programs/categories";

export default async function PersonalityReportPage() {
  const session = await requireStudent();
  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) {
    redirect(PERSONALITY_PROFILE_HREF);
  }
  if (!workspace.report) {
    redirect(PERSONALITY_PROFILE_HREF);
  }

  const slugs = workspace.report.recommendations.map((item) => item.slug);
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
        title="Your personality profile"
        description="Aptitude and quantitative bands plus a qualitative psyche map — use this to choose a Foundrys path."
        actions={
          <Link href={PERSONALITY_PROFILE_HREF}>
            <Button size="sm" variant="ghost">
              Back to assessment
            </Button>
          </Link>
        }
      />
      <PersonalityReportView report={workspace.report} titles={titles} />
    </div>
  );
}
