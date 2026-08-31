import { Badge } from "@/components/ui/badge";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Panel } from "@/components/ui/page";
import { prisma } from "@/lib/db";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const certificate = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      user: { select: { name: true } },
      program: { select: { title: true } },
      organization: { select: { title: true } },
    },
  });

  return (
    <MarketingShell maxWidth="max-w-xl" showArt={false}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Credential verification
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Certificate verification</h1>
      {!certificate ? (
        <Panel className="mt-8 p-5">
          <Badge tone="danger">Not found</Badge>
          <p className="mt-3 text-sm text-fg-muted">
            No credential matches certificate ID {certificateId}.
          </p>
        </Panel>
      ) : (
        <Panel className="mt-8 p-5">
          <Badge tone={certificate.status === "ACTIVE" ? "success" : "danger"}>
            {certificate.status === "ACTIVE" ? "Valid" : "Revoked"}
          </Badge>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-fg-muted">Learner</dt>
              <dd className="font-medium">{certificate.user.name}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Course</dt>
              <dd className="font-medium">{certificate.program.title}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Issued by</dt>
              <dd>{certificate.organization.title}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Issued</dt>
              <dd>{certificate.issueDate.toLocaleDateString("en-IN")}</dd>
            </div>
            <div>
              <dt className="text-fg-muted">Certificate ID</dt>
              <dd className="font-mono">{certificate.certificateId}</dd>
            </div>
          </dl>
        </Panel>
      )}
    </MarketingShell>
  );
}
