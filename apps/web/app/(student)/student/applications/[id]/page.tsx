import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationForm } from "@/components/student/application-form";
import { FeePaymentPanel } from "@/components/student/fee-payment-panel";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, Panel } from "@/components/ui/page";
import { StatusTimeline } from "@/components/ui/timeline";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseFormSchema } from "@/lib/forms/schema";
import { APPLICATION_STATUS_LABELS } from "@/lib/workflows/status";

export default async function StudentApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireStudent();

  const application = await prisma.application.findFirst({
    where: {
      id,
      applicantId: session.user.id,
      organizationId: session.user.organizationId,
    },
    include: {
      program: true,
      intake: true,
      formVersion: true,
      documents: true,
      events: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();

  const schema = parseFormSchema(application.formVersion.schemaJson);
  const answers = JSON.parse(application.answersJson) as Record<string, unknown>;
  const readOnly = application.status !== "DRAFT";
  const paid = application.payments.find((p) => p.status === "PAID");
  const showFee =
    application.status === "FEE_REQUESTED" ||
    application.status === "OFFERED" ||
    Boolean(paid) ||
    (application.program.applicationFee != null &&
      application.program.applicationFee > 0 &&
      application.status === "SUBMITTED");

  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/student/applications", label: "Applications" },
          { label: application.program.title },
        ]}
      />
      <PageHeader
        title={application.program.title}
        description={
          application.intake
            ? `Intake: ${application.intake.name}`
            : "Admission application"
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
        {application.referenceNumber ? (
          <span className="text-xs text-fg-muted">
            Ref: {application.referenceNumber}
          </span>
        ) : null}
        <Link href="/courses" className="text-xs underline text-fg-muted ml-auto">
          Browse courses
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <ApplicationForm
            applicationId={application.id}
            schema={schema}
            initialAnswers={answers}
            documents={application.documents.map((d) => ({
              fieldKey: d.fieldKey,
              fileName: d.fileName,
              storagePath: d.storagePath,
            }))}
            readOnly={readOnly}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {showFee ? (
            <Panel className="p-5">
              <h2 className="text-sm font-medium mb-3">Application fee</h2>
              <FeePaymentPanel
                applicationId={application.id}
                amount={application.program.applicationFee}
                currency={application.program.tuitionCurrency}
                alreadyPaid={Boolean(paid)}
                paidAmount={paid?.amount}
                paymentDate={paid?.paymentDate?.toISOString() ?? null}
              />
            </Panel>
          ) : null}

          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-3">Timeline</h2>
            <StatusTimeline
              events={application.events}
              currentStatus={application.status}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
