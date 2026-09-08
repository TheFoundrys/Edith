import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import {
  PersonalityIdentityStep,
  PersonalityResumeForm,
} from "@/components/student/personality-kyc-form";
import { PersonalityResumeRecs } from "@/components/student/personality-resume-recs";
import {
  PersonalityStepIndex,
  PersonalityWizardSteps,
} from "@/components/student/personality-wizard";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_EXAM_HREF,
  PERSONALITY_PROFILE_ENROLL_HREF,
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_PUBLIC_HREF,
  PERSONALITY_PROFILE_RANK_HREF,
  PERSONALITY_STUDENT_RANK_HREF,
} from "@/lib/assessments/personality-profile";

const NOTICE: Record<string, string> = {
  verified: "Aadhaar verified. Add PAN to finish identity.",
  identity: "Identity saved. Upload your resume next.",
  aadhaar_denied: "DigiLocker verification was cancelled. You can try again or enter Aadhaar.",
  aadhaar_failed: "DigiLocker could not verify Aadhaar. Enter Aadhaar instead, or try DigiLocker again.",
  aadhaar_no_document:
    "This DigiLocker account has no e-Aadhaar. Enter your Aadhaar number instead.",
  digilocker_unconfigured:
    "DigiLocker is not configured. Enter your 12-digit Aadhaar number to continue.",
};

export default async function PersonalityProfileHubPage({
  searchParams,
}: {
  searchParams: Promise<{ aadhaar?: string; identity?: string; error?: string }>;
}) {
  const params = await searchParams;
  const noticeKey =
    params.identity === "verified"
      ? "identity"
      : params.aadhaar === "verified"
        ? "verified"
        : params.error;
  const notice = noticeKey ? NOTICE[noticeKey] : null;

  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) {
    return (
      <div>
        <PageHeader
          title="Edith Personality Profile"
          description="Aadhaar and PAN, resume skills, then the mandatory ₹3,500 sitting."
        />
        <EmptyState
          title="Assessment not available"
          description="The Edith Personality Profile is not published for this campus yet."
          action={
            <Link href={PERSONALITY_PROFILE_PUBLIC_HREF}>
              <Button size="sm" variant="secondary">
                View details
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={workspace.programTitle}
        description="Identity, resume skills, then the mandatory ₹3,500 exam."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={PERSONALITY_STUDENT_RANK_HREF}>
              <Button size="sm" variant="secondary">
                Rank board
              </Button>
            </Link>
            {workspace.report ? (
              <Link href={`${PERSONALITY_PROFILE_HREF}/report`}>
                <Button size="sm">View report</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {notice ? (
        <Panel className="mb-6 p-4 sm:p-5">
          <p className="text-sm">{notice}</p>
        </Panel>
      ) : null}

      <PersonalityWizardSteps
        current={workspace.wizard.step}
        done={workspace.wizard}
      />

      <Panel
        id="personality-step-1"
        className={
          workspace.wizard.step === 1 && !workspace.wizard.exam
            ? "personality-panel is-current mb-6 p-5"
            : "personality-panel mb-6 p-5"
        }
      >
        <div className="personality-panel-head">
          <PersonalityStepIndex
            n={1}
            done={workspace.wizard.identity}
            current={workspace.wizard.step === 1 && !workspace.wizard.exam}
          />
          <div>
            <p className="personality-panel-kicker">Step 1 of 3</p>
            <h2 className="font-display text-xl tracking-tight">Identity</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Aadhaar and PAN. Hashes and last-four only — never the full numbers.
            </p>
          </div>
        </div>
        <PersonalityIdentityStep
          aadhaarMask={workspace.aadhaar?.mask}
          aadhaarName={workspace.aadhaar?.name}
          aadhaarSource={workspace.aadhaar?.source}
          panMask={workspace.pan?.mask}
          canUnlink={workspace.canUnlinkAadhaar}
          resumeOnFile={workspace.resumeOnFile}
          digilockerAvailable={workspace.digilockerAvailable}
        />
      </Panel>

      {workspace.wizard.identity ? (
        <Panel
          id="personality-step-2"
          className={
            workspace.wizard.step === 2 && !workspace.wizard.exam
              ? "personality-panel is-current mb-6 p-5"
              : "personality-panel mb-6 p-5"
          }
        >
          <div className="personality-panel-head">
            <PersonalityStepIndex
              n={2}
              done={workspace.wizard.resume}
              current={workspace.wizard.step === 2 && !workspace.wizard.exam}
            />
            <div>
              <p className="personality-panel-kicker">Step 2 of 3</p>
              <h2 className="font-display text-xl tracking-tight">Resume</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Upload a resume. Edith reads skills and recommends the sitting.
              </p>
            </div>
          </div>
          {workspace.kyc ? (
            <div className="space-y-4">
              <p className="text-sm">
                Aadhaar {workspace.kyc.aadhaarMask} · PAN {workspace.kyc.panMask}
              </p>
              <p className="text-sm text-fg-muted">{workspace.kyc.resumeFileName}</p>
              <PersonalityResumeRecs
                skills={workspace.resumeSkills}
                recs={workspace.resumeRecs}
              />
            </div>
          ) : (
            <PersonalityResumeForm />
          )}
        </Panel>
      ) : null}

      {workspace.wizard.resume ? (
        <Panel
          id="personality-step-3"
          className={
            workspace.wizard.step === 3 && !workspace.wizard.exam
              ? "personality-panel is-current mb-6 p-5"
              : "personality-panel mb-6 p-5"
          }
        >
          <div className="personality-panel-head">
            <PersonalityStepIndex
              n={3}
              done={workspace.wizard.exam}
              current={workspace.wizard.step === 3 && !workspace.wizard.exam}
            />
            <div>
              <p className="personality-panel-kicker">Step 3 of 3</p>
              <h2 className="font-display text-xl tracking-tight">
                {workspace.recommendedExam.title}
              </h2>
            </div>
          </div>
          <p className="mt-2 font-display text-2xl">{workspace.recommendedExam.fee}</p>
          <p className="mt-2 text-sm text-fg-muted leading-relaxed">
            {workspace.recommendedExam.reason}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3 text-sm text-fg-muted">
            {workspace.batteries.map((battery) => (
              <li key={battery.id}>
                {battery.title} · {battery.questionCount} questions
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-fg-muted">
                {workspace.progress.done} of {workspace.progress.total} questions
                complete
              </p>
              {workspace.rank ? (
                <p className="mt-1 text-sm">
                  Rank #{workspace.rank.place} of {workspace.rank.total} ·{" "}
                  {workspace.rank.percentile}th percentile · composite{" "}
                  {workspace.rank.composite}
                </p>
              ) : null}
            </div>
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
          <div className="mt-5 flex flex-wrap gap-2">
            {workspace.progress.pct === 100 ? (
              <>
                <Link href={`${PERSONALITY_PROFILE_HREF}/report`}>
                  <Button size="sm">View scores on profile</Button>
                </Link>
                <Link href={PERSONALITY_PROFILE_RANK_HREF}>
                  <Button size="sm" variant="secondary">
                    Public board
                  </Button>
                </Link>
              </>
            ) : workspace.enrolled ? (
              <Link href={PERSONALITY_EXAM_HREF}>
                <Button size="sm">Sit the Edith exam</Button>
              </Link>
            ) : (
              <Link href={PERSONALITY_PROFILE_ENROLL_HREF}>
                <Button size="sm">Enroll now · ₹3,500 + GST</Button>
              </Link>
            )}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
