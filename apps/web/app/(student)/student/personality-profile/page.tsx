import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_PROFILE_ENROLL_HREF,
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_PUBLIC_HREF,
  personalitySectionHref,
} from "@/lib/assessments/personality-profile";

export default async function PersonalityProfileHubPage() {
  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) {
    return (
      <div>
        <PageHeader
          title="Personality Profile"
          description="Aptitude, quantitative and qualitative psyche analysis — one sitting, one profile."
        />
        <EmptyState
          title="You are not enrolled yet"
          description="This assessment is ₹3,500 + GST and open to every career stage. Enroll to unlock the three batteries and your report."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href={PERSONALITY_PROFILE_ENROLL_HREF}>
                <Button size="sm">Enroll now</Button>
              </Link>
              <Link href={PERSONALITY_PROFILE_PUBLIC_HREF}>
                <Button size="sm" variant="secondary">
                  View details
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={workspace.programTitle}
        description="Complete aptitude, quantitative and qualitative psyche analysis in one sitting. Submit each section once — your report unlocks when all three are done."
        actions={
          workspace.report ? (
            <Link href={`${PERSONALITY_PROFILE_HREF}/report`}>
              <Button size="sm">View report</Button>
            </Link>
          ) : null
        }
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-fg-muted">
            {workspace.progress.done} of {workspace.progress.total} sections complete
          </p>
          <Badge tone={workspace.progress.pct === 100 ? "success" : "neutral"}>
            {workspace.progress.pct}%
          </Badge>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full bg-accent"
            style={{ width: `${workspace.progress.pct}%` }}
          />
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-3">
        {workspace.sections.map((section, index) => (
          <Panel key={section.id} className="flex flex-col p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
              Battery {index + 1}
            </p>
            <h2 className="mt-2 font-display text-xl">{section.title}</h2>
            <p className="mt-2 text-sm text-fg-muted">{section.summary}</p>
            <p className="mt-2 text-xs text-fg-muted">
              {section.questionCount} questions · about {section.minutes} min
            </p>
            <div className="mt-auto pt-4">
              {section.done ? (
                <Badge tone="success">Submitted</Badge>
              ) : (
                <Link href={personalitySectionHref(section.id)}>
                  <Button size="sm">Start</Button>
                </Link>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
