import { ProfileForm } from "@/components/student/profile-form";
import { PersonalityReportView } from "@/components/student/personality-report";
import { PageHeader, Panel } from "@/components/ui/page";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { displayProgramName } from "@/lib/programs/categories";

export default async function StudentProfilePage() {
  const session = await requireStudent();
  const [user, workspace] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    getPersonalityProfileWorkspace(),
  ]);

  const recSlugs =
    workspace.ok ? workspace.report?.recommendations.map((item) => item.slug) ?? [] : [];
  const programs = recSlugs.length
    ? await prisma.program.findMany({
        where: {
          organizationId: session.user.organizationId,
          slug: { in: recSlugs },
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
        title="Profile"
        description="Account details, assessment scores and programme recommendations."
      />
      {workspace.ok && workspace.report ? (
        <div className="mb-8">
          <h2 className="mb-4 font-display text-xl">Personality Profile scores</h2>
          {workspace.rank ? (
            <p className="mb-4 text-sm">
              Rank #{workspace.rank.place} of {workspace.rank.total} ·{" "}
              {workspace.rank.percentile}th percentile · Aptitude{" "}
              {workspace.rank.aptitudeBand} {workspace.rank.aptitudePercent}% ·
              Quantitative {workspace.rank.quantitativeBand}{" "}
              {workspace.rank.quantitativePercent}% · Psyche{" "}
              {workspace.rank.psycheLabel}
            </p>
          ) : null}
          {workspace.kyc ? (
            <p className="mb-4 text-sm text-fg-muted">
              Aadhaar {workspace.kyc.aadhaarMask} · PAN {workspace.kyc.panMask} ·{" "}
              {workspace.kyc.resumeFileName}
            </p>
          ) : null}
          <PersonalityReportView
            report={workspace.report}
            titles={titles}
            rank={workspace.rank}
            ragGuidance={workspace.ragGuidance}
          />
        </div>
      ) : null}
      <Panel className="p-5">
        <ProfileForm
          initialName={user?.name ?? session.user.name}
          email={session.user.email}
          phoneNumber={user?.phoneNumber}
          username={user?.username}
          headline={user?.headline}
          bio={user?.bio}
          theme={user?.theme}
          careerPath={user?.careerPath}
        />
      </Panel>
    </div>
  );
}
