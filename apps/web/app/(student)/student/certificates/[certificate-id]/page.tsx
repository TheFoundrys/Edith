import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificatePrintButton } from "@/components/student/certificate-print-button";
import { PageHeader, Panel } from "@/components/ui/page";
import { loadStudentCertificateDetail } from "@/lib/certificates/queries";
import { requireStudent } from "@/lib/auth/session";
import { APP_LOCKUP } from "@/lib/brand";

export default async function StudentCertificateDetailPage({
  params,
}: {
  params: Promise<{ "certificate-id": string }>;
}) {
  const { "certificate-id": certificateId } = await params;
  const session = await requireStudent();

  const certificate = await loadStudentCertificateDetail(
    session.user.id,
    certificateId,
  );
  if (!certificate) notFound();

  return (
    <div>
      <PageHeader
        title="Certificate"
        description={certificate.program.title}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <CertificatePrintButton />
            <Link
              href="/student/certificates"
              className="text-sm text-fg-muted underline"
            >
              All certificates
            </Link>
          </div>
        }
      />

      <Panel className="certificate-print-panel p-8 sm:p-10 text-center border-2 border-border">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
          {APP_LOCKUP}
        </p>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          Certificate of Completion
        </h2>
        <p className="mt-6 text-sm text-fg-muted">This certifies that</p>
        <p className="mt-2 text-xl font-medium">{certificate.user.name}</p>
        <p className="mt-6 text-sm text-fg-muted">has successfully completed</p>
        <p className="mt-2 text-lg font-medium">{certificate.program.title}</p>
        <p className="mt-8 text-xs text-fg-muted">
          Issued {certificate.issueDate.toLocaleDateString()} · Code{" "}
          {certificate.certificateId}
        </p>
        <Link
          href={`/verify/${encodeURIComponent(certificate.certificateId)}`}
          className="mt-4 inline-block text-sm underline"
        >
          Open public verification
        </Link>
      </Panel>
    </div>
  );
}
