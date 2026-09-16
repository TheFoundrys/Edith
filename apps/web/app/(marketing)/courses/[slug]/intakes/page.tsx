import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { buildCourseLandingModel } from "@/lib/marketing/course-page-data";
import { loadPublicCourseLandingSource } from "@/lib/marketing/public-course-detail";
import { getDefaultOrganizationId } from "@/lib/organizations/default";

export default async function CourseIntakesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const organizationId = await getDefaultOrganizationId();

  const course = await loadPublicCourseLandingSource(slug, organizationId);
  if (!course) notFound();

  const model = buildCourseLandingModel({
    course,
    learnerCount: course._count.enrollments,
  });

  return (
    <MarketingShell maxWidth="max-w-2xl">
      <PageHeader
        title="Open intakes"
        description={`Choose a cohort for ${model.title}.`}
        actions={
          <Link href={`/courses/${course.slug}`}>
            <Button variant="secondary" size="sm">
              Back to course
            </Button>
          </Link>
        }
      />

      {model.intakes.length === 0 ? (
        <Panel className="p-6">
          <p className="text-sm text-fg-muted">
            No active intakes right now. Check back later or contact admissions.
          </p>
        </Panel>
      ) : (
        <div className="space-y-3">
          {model.intakes.map((intake) => (
            <Panel key={intake.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-medium">{intake.name}</h2>
                  <p className="mt-1 text-sm text-fg-muted">{intake.closeLabel}</p>
                </div>
                <Link href={`/enroll/${course.slug}?intake=${intake.id}`}>
                  <Button size="sm">Enroll in this intake</Button>
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </MarketingShell>
  );
}
