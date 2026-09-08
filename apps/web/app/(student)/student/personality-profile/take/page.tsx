import Link from "next/link";
import { redirect } from "next/navigation";
import { PersonalityExamForm } from "@/components/student/personality-exam-form";
import { PersonalityWizardSteps } from "@/components/student/personality-wizard";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { getPersonalityExam } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_PROFILE_HREF,
} from "@/lib/assessments/personality-profile";

export default async function PersonalityTakeExamPage() {
  const data = await getPersonalityExam();
  if (!data.ok) {
    redirect(PERSONALITY_PROFILE_HREF);
  }

  if (data.done) {
    redirect(`${PERSONALITY_PROFILE_HREF}/report`);
  }

  return (
    <div>
      <PageHeader
        title="Personality Profile exam"
        description="90 questions in one sitting — aptitude, quantitative and psyche. Page through the paper and submit once at the end."
        actions={
          <Link href={PERSONALITY_PROFILE_HREF}>
            <Button size="sm" variant="ghost">
              Back
            </Button>
          </Link>
        }
      />
      <PersonalityWizardSteps
        current={3}
        done={{ identity: true, resume: true, exam: false }}
      />
      <Panel id="personality-step-3" className="personality-panel is-current p-5">
        <PersonalityExamForm questions={data.questions} />
      </Panel>
    </div>
  );
}
