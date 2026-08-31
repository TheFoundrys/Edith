import { Award } from "lucide-react";
import Link from "next/link";

export type SidebarCertificate = {
  id: string;
  title: string;
  programTitle: string;
};

export function LmsCertificateTiles({
  certificates,
}: {
  certificates: SidebarCertificate[];
}) {
  if (certificates.length === 0) return null;

  return (
    <div className="lms-cert-stack">
      {certificates.slice(0, 2).map((certificate) => (
        <Link
          key={certificate.id}
          href={`/student/certificates/${certificate.id}`}
          className="lms-cert-tile group"
        >
          <div className="lms-cert-tile-seal" aria-hidden>
            <Award className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg group-hover:text-brand">
              {certificate.title}
            </p>
            <p className="truncate text-[11px] text-fg-muted">{certificate.programTitle}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
