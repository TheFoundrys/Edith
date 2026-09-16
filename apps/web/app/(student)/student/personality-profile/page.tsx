import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import {
  PersonalityIdentityStep,
  PersonalityResumeForm,
} from "@/components/student/personality-kyc-form";
import { PersonalityExamStep } from "@/components/student/personality-exam-step";
import { PersonalityResumeRecs } from "@/components/student/personality-resume-recs";
import { PersonalityProfileFlow } from "@/components/student/personality-wizard";
import { getPersonalityProfileWorkspace } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_PUBLIC_HREF,
  PERSONALITY_PROFILE_RANK_HREF,
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
      <div>
        <PageHeader
          title="Edith Personality Profile"
          description="Contact details, Aadhaar and PAN, resume skills, then the mandatory ₹3,500 sitting."
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
        description="Your details, resume skills, then the mandatory ₹3,500 exam."
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
        <Panel
          className={`mb-6 p-4 sm:p-5 ${
            noticeKey === "paid" ? "personality-notice is-success" : "personality-notice"
          }`}
        >
          <p className="text-sm">{notice}</p>
        </Panel>
      ) : null}

      <PersonalityProfileFlow
        defaultStep={workspace.wizard.step}
        done={workspace.wizard}
        identity={
          <Panel
            id="personality-step-1"
            className={
              workspace.wizard.identity
                ? "personality-panel is-complete p-5"
                : "personality-panel is-current p-5"
            }
          >
            <div className="personality-panel-head">
              <div>
                <p className="personality-panel-kicker">Identity</p>
                <h2 className="font-display text-xl tracking-tight">Your details</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  Contact details plus Aadhaar and PAN as printed on your cards.
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
              workspace.wizard.resume
                ? "personality-panel is-complete p-5"
                : "personality-panel is-current p-5"
            }
          >
            <div className="personality-panel-head">
              <div>
                <p className="personality-panel-kicker">Resume</p>
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
        }
        exam={
          <Panel
            id="personality-step-3"
            className={
              workspace.wizard.exam
                ? "personality-panel is-complete p-5"
                : "personality-panel is-current p-5"
            }
          >
            <div className="personality-panel-head">
              <div>
                <p className="personality-panel-kicker">Exam</p>
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
