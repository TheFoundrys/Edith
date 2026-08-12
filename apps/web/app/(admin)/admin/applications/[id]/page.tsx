import { notFound } from "next/navigation";
import { DocumentReviewList } from "@/components/admin/document-review-list";
import { OfflinePaymentForm } from "@/components/admin/offline-payment-form";
import { StatusTransitionForm } from "@/components/admin/status-transition-form";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { PageHeader, Panel } from "@/components/ui/page";
import { StatusTimeline } from "@/components/ui/timeline";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parseFormSchema } from "@/lib/forms/schema";
import { formatCurrency } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, nextStatuses } from "@/lib/workflows/status";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCapability("manageApplications");

  const application = await prisma.application.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      applicant: true,
      program: true,
      intake: true,
      formVersion: true,
      documents: true,
      events: { include: { actor: true }, orderBy: { createdAt: "asc" } },
      crmSyncLogs: { orderBy: { createdAt: "desc" }, take: 5 },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!application) notFound();

  const schema = parseFormSchema(application.formVersion.schemaJson);
  const answers = JSON.parse(application.answersJson) as Record<string, unknown>;
  const transitions = nextStatuses(application.status);
  const paid = application.payments.find((p) => p.status === "PAID");
  const canRecordOffline =
    !paid &&
    (application.status === "FEE_REQUESTED" || application.status === "OFFERED");

  return (
    <div>
      <Breadcrumbs
        items={[
          { href: "/admin/applications", label: "Applications" },
          { label: application.applicant.name },
        ]}
      />
      <PageHeader
        title={application.applicant.name}
        description={`${application.program.name}${
          application.intake ? ` · ${application.intake.name}` : ""
        }`}
      />
      <div className="mb-6">
        <Badge>{APPLICATION_STATUS_LABELS[application.status]}</Badge>
        {application.crmLeadId ? (
          <span className="ml-3 text-xs text-fg-muted">CRM lead: {application.crmLeadId}</span>
        ) : null}
        {application.crmApplicationId ? (
          <span className="ml-3 text-xs text-fg-muted">
            CRM app: {application.crmApplicationId}
          </span>
        ) : null}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">Answers</h2>
            <dl className="space-y-4">
              {schema.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-xs uppercase tracking-wide text-fg-muted mb-2">
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.fields
                      .filter((f) => f.type !== "section")
                      .map((field) => (
                        <div
                          key={field.key}
                          className="grid grid-cols-3 gap-2 text-sm border-b border-border pb-2"
                        >
                          <dt className="text-fg-muted col-span-1">{field.label}</dt>
                          <dd className="col-span-2 break-words">
                            {answers[field.key] == null || answers[field.key] === ""
                              ? "—"
                              : String(answers[field.key])}
                          </dd>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">Documents</h2>
            <DocumentReviewList
              documents={application.documents.map((doc) => ({
                id: doc.id,
                fieldKey: doc.fieldKey,
                fileName: doc.fileName,
                storagePath: doc.storagePath,
                sizeBytes: doc.sizeBytes,
                verifiedAt: doc.verifiedAt?.toISOString() ?? null,
              }))}
            />
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">Update status</h2>
            <StatusTransitionForm
              applicationId={application.id}
              nextStatuses={transitions}
            />
            <p className="text-xs text-fg-muted mt-3">
              After an offer, move to Fee requested. Enrollment happens when the fee is paid
              (student checkout or offline record below).
            </p>
          </Panel>

          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">Payments</h2>
            {application.payments.length === 0 ? (
              <p className="text-sm text-fg-muted mb-4">No payment attempts yet.</p>
            ) : (
              <ul className="space-y-2 text-sm mb-4">
                {application.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <span>
                      {formatCurrency(p.amount, p.currency)} · {p.provider} · {p.status}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {p.paidAt
                        ? p.paidAt.toLocaleString()
                        : p.createdAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <OfflinePaymentForm
              applicationId={application.id}
              amount={application.program.applicationFee}
              currency={application.program.tuitionCurrency}
              canRecord={canRecordOffline}
            />
          </Panel>

          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">Timeline</h2>
            <StatusTimeline
              events={application.events}
              currentStatus={application.status}
            />
          </Panel>
          <Panel className="p-5">
            <h2 className="text-sm font-medium mb-4">CRM sync</h2>
            {application.crmSyncLogs.length === 0 ? (
              <p className="text-sm text-fg-muted">No CRM sync attempts yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {application.crmSyncLogs.map((log) => (
                  <li key={log.id} className="flex justify-between gap-2">
                    <span>
                      {log.action} · {log.status}
                    </span>
                    <span className="text-fg-muted">
                      {log.createdAt.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
