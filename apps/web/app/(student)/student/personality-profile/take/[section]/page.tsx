import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PersonalitySectionForm } from "@/components/student/personality-section-form";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { getPersonalitySection } from "@/lib/actions/personality-profile";
import {
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_SECTIONS,
  type PersonalitySectionId,
} from "@/lib/assessments/personality-profile";

const SECTION_IDS = new Set(PERSONALITY_SECTIONS.map((section) => section.id));

export default async function PersonalityTakeSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: raw } = await params;
  if (!SECTION_IDS.has(raw as PersonalitySectionId)) notFound();
  const section = raw as PersonalitySectionId;

  const data = await getPersonalitySection(section);
  if (!data.ok) {
    redirect(PERSONALITY_PROFILE_HREF);
  }

  if (data.done) {
    redirect(PERSONALITY_PROFILE_HREF);
  }

  return (
    <div>
      <PageHeader
        title={data.title}
        description={data.summary}
        actions={
          <Link href={PERSONALITY_PROFILE_HREF}>
            <Button size="sm" variant="ghost">
              All sections
            </Button>
          </Link>
        }
      />
      <Panel className="p-5">
        <PersonalitySectionForm section={section} questions={data.questions} />
      </Panel>
    </div>
  );
}
