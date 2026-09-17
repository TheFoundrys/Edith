import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/page";
import {
  PersonalityIdentityStep,
  PersonalityResumeForm,
} from "@/components/student/personality-kyc-form";
import { PersonalityExamStep } from "@/components/student/personality-exam-step";
import { PersonalityResumeRecs } from "@/components/student/personality-resume-recs";
import {
  PersonalityProfileFlow,
  PersonalityStepIndex,
} from "@/components/student/personality-wizard";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_PUBLIC_HREF,
  PERSONALITY_STUDENT_RANK_HREF,
} from "@/lib/assessments/personality-profile";

const NOTICE: Record<string, string> = {
  saved: "Details saved. Upload your resume next.",
  verified: "Details saved. Upload your resume next.",
  identity: "Details saved. Upload your resume next.",
  paid: "Payment received. Your exam sitting is unlocked — start when you're ready.",
  aadhaar_denied: "DigiLocker was cancelled. Enter Aadhaar on this form instead.",
  aadhaar_failed: "DigiLocker could not be used. Enter Aadhaar on this form instead.",
  aadhaar_no_document:
    "This DigiLocker account has no e-Aadhaar. Enter your Aadhaar number instead.",
  digilocker_unconfigured:
    "Enter your details, including Aadhaar and PAN, to continue.",
};

export default async function PersonalityProfileHubPage({
  searchParams,
}: {
  searchParams: Promise<{
    aadhaar?: string;
    identity?: string;
    error?: string;
    paid?: string;
  }>;
}) {
  const params = await searchParams;
  const noticeKey =
    params.paid === "1"
      ? "paid"
      : params.identity === "saved" || params.identity === "verified"
        ? "saved"
        : params.aadhaar === "verified"
          ? "saved"
          : params.error;
  const notice = noticeKey ? NOTICE[noticeKey] : null;

  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) {
    return (
      <div className="personality-hub">
        <header className="personality-hub-hero">
          <p className="personality-hub-kicker">Assessment</p>
          <h1 className="personality-hub-title">Edith Personality Profile</h1>
          <p className="personality-hub-lead">
            Contact details, Aadhaar and PAN, resume skills, then the exam sitting.
          </p>
        </header>
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

  const wizard = workspace.wizard;
  const completedSteps =
    Number(wizard.identity) + Number(wizard.resume) + Number(wizard.exam);
  const currentLabel = wizard.exam
    ? "Complete"
    : wizard.resume
      ? "Exam"
      : wizard.identity
        ? "Resume"
        : "Identity";
  const progressPct = Math.round((completedSteps / 3) * 100);

  return (
    <div className="personality-hub">
      <header className="personality-hub-hero">
        <div className="personality-hub-hero-copy">
          <p className="personality-hub-kicker">Assessment · 3 steps</p>
          <h1 className="personality-hub-title">{workspace.programTitle}</h1>
          <p className="personality-hub-lead">
            Confirm who you are, share a resume, then sit the 90-question profile.
            Rank and scores land on your report when you finish.
          </p>
          <div className="personality-hub-progress">
            <div className="personality-hub-progress-meta">
              <span>
                {completedSteps} of 3 steps complete
              </span>
              <span>{wizard.exam ? "Profile complete" : `Current: ${currentLabel}`}</span>
            </div>
            <div className="personality-hub-progress-track" aria-hidden>
              <div
                className="personality-hub-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
        <div className="personality-hub-hero-actions">
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
      </header>

      {notice ? (
        <Panel
          className={`mb-6 p-4 sm:p-5 ${
            noticeKey === "paid" ? "personality-notice is-success" : "personality-notice"
          }`}
        >
          <p className="text-sm">{notice}</p>
        </Panel>
      ) : null}

      <PersonalityProfileFlow
        defaultStep={wizard.step}
        done={wizard}
        identity={
          <Panel
            id="personality-step-1"
            className={
              wizard.identity
                ? "personality-panel is-complete p-5 sm:p-6"
                : "personality-panel is-current p-5 sm:p-6"
            }
          >
            <div className="personality-panel-head">
              <PersonalityStepIndex n={1} done={wizard.identity} current={!wizard.identity} />
              <div>
                <p className="personality-panel-kicker">Step 1 · Identity</p>
                <h2 className="font-display text-xl tracking-tight">Your details</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Contact plus Aadhaar and PAN exactly as printed on your cards.
                </p>
              </div>
            </div>
            <PersonalityIdentityStep
              defaults={workspace.identityDefaults}
              aadhaarMask={workspace.aadhaar?.mask}
              panMask={workspace.pan?.mask}
              locked={workspace.identityLocked}
              resumeOnFile={workspace.resumeOnFile}
            />
          </Panel>
        }
        resume={
          <Panel
            id="personality-step-2"
            className={
              wizard.resume
                ? "personality-panel is-complete p-5 sm:p-6"
                : "personality-panel is-current p-5 sm:p-6"
            }
          >
            <div className="personality-panel-head">
              <PersonalityStepIndex
                n={2}
                done={wizard.resume}
                current={wizard.identity && !wizard.resume}
              />
              <div>
                <p className="personality-panel-kicker">Step 2 · Resume</p>
                <h2 className="font-display text-xl tracking-tight">Skills from your resume</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Upload a PDF or Word file. Edith extracts skills and recommends the sitting.
                </p>
              </div>
            </div>
            {workspace.kyc ? (
              <div className="space-y-4">
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
        }
        exam={
          <Panel
            id="personality-step-3"
            className={
              wizard.exam
                ? "personality-panel is-complete p-5 sm:p-6"
                : "personality-panel is-current p-5 sm:p-6"
            }
          >
            <div className="personality-panel-head">
              <PersonalityStepIndex
                n={3}
                done={wizard.exam}
                current={wizard.resume && !wizard.exam}
              />
              <div>
                <p className="personality-panel-kicker">Step 3 · Exam</p>
                <h2 className="font-display text-xl tracking-tight">
                  {workspace.recommendedExam.title}
                </h2>
              </div>
            </div>
            <PersonalityExamStep
              examUnlocked={workspace.examUnlocked === true}
              recommendedExam={workspace.recommendedExam}
              batteries={workspace.batteries}
              progress={workspace.progress}
              rank={workspace.rank}
              courseSlug={workspace.programSlug}
              quote={workspace.quote}
              payment={workspace.payment}
            />
          </Panel>
        }
      />
    </div>
  );
}
