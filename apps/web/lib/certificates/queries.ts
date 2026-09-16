import "server-only";

import {
  countCompassCertificatesForUser,
  getCompassCertificateByPublicId,
  getCompassCertificateForUser,
  listCompassCertificatesForUser,
  type CompassCertificateView,
} from "@/lib/compass/certificates";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

export type StudentCertificateView = {
  id: string;
  title: string;
  certificateId: string;
  issueDate: Date;
  status: string;
  program: { title: string };
  user: { name: string };
};

function fromCompass(row: CompassCertificateView): StudentCertificateView {
  return {
    id: row.id,
    title: row.title,
    certificateId: row.certificateId,
    issueDate: row.issueDate,
    status: row.status,
    program: row.program,
    user: row.user,
  };
}

export async function loadStudentCertificates(
  userId: string,
): Promise<StudentCertificateView[]> {
  if (isCompassDatabase()) {
    return (await listCompassCertificatesForUser(userId)).map(fromCompass);
  }

  const rows = await prisma.certificate.findMany({
    where: { userId },
    include: { program: { select: { title: true } }, user: { select: { name: true } } },
    orderBy: { issueDate: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    certificateId: row.certificateId,
    issueDate: row.issueDate,
    status: row.status,
    program: row.program,
    user: row.user,
  }));
}

export async function countStudentCertificates(userId: string): Promise<number> {
  if (isCompassDatabase()) {
    return countCompassCertificatesForUser(userId);
  }
  return prisma.certificate.count({ where: { userId } });
}

export async function loadStudentCertificateDetail(
  userId: string,
  certificateRowId: string,
): Promise<StudentCertificateView | null> {
  if (isCompassDatabase()) {
    const row = await getCompassCertificateForUser(userId, certificateRowId);
    return row ? fromCompass(row) : null;
  }

  const row = await prisma.certificate.findFirst({
    where: { id: certificateRowId, userId },
    include: { program: { select: { title: true } }, user: { select: { name: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    certificateId: row.certificateId,
    issueDate: row.issueDate,
    status: row.status,
    program: row.program,
    user: row.user,
  };
}

export async function loadPublicCertificate(certificateId: string) {
  if (isCompassDatabase()) {
    const row = await getCompassCertificateByPublicId(certificateId);
    return row ? fromCompass(row) : null;
  }

  const row = await prisma.certificate.findUnique({
    where: { certificateId },
    include: { program: { select: { title: true } }, user: { select: { name: true } } },
  });
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    certificateId: row.certificateId,
    issueDate: row.issueDate,
    status: row.status,
    program: row.program,
    user: row.user,
  };
}
