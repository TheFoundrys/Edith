import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function StudentCertificatesPage() {
  const session = await requireStudent();

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { program: { select: { name: true } } },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Certificates issued when you complete a course."
      />

      {certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Finish all activities in a course to earn a certificate."
          action={
            <Link href="/student/my-courses" className="text-sm underline">
              My courses
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {certificates.map((certificate) => (
            <Panel key={certificate.id} className="p-5">
              <Link
                href={`/student/certificates/${certificate.id}`}
                className="font-medium hover:underline"
              >
                {certificate.title}
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                {certificate.program.name} · Issued{" "}
                {certificate.issuedAt.toLocaleDateString()} ·{" "}
                {certificate.certificateCode}
              </p>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
