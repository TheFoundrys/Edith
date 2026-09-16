import "server-only";

import { prisma } from "@/lib/db";

export type CompassCertificateView = {
  id: string;
  userId: string;
  programId: string;
  title: string;
  certificateId: string;
  issueDate: Date;
  status: string;
  program: { title: string };
  user: { name: string };
};

type CertificateRow = {
  id: string;
  userId: string;
  courseId: string | null;
  certificateId: string;
  issueDate: Date;
  status: string;
  programTitle: string | null;
  userName: string | null;
};

function mapCertificate(row: CertificateRow): CompassCertificateView {
  const programTitle = row.programTitle ?? "Course";
  return {
    id: row.id,
    userId: row.userId,
    programId: row.courseId ?? "",
    title: programTitle,
    certificateId: row.certificateId,
    issueDate: row.issueDate,
    status: row.status,
    program: { title: programTitle },
    user: { name: row.userName ?? "Student" },
  };
}

const CERTIFICATE_JOIN = `
  FROM "Certificate" c
  LEFT JOIN "Course" co ON co.id = c."courseId"
  LEFT JOIN "User" u ON u.id = c."userId"
`;

const CERTIFICATE_SELECT = `
  c.id, c."userId", c."courseId", co.title AS "programTitle",
  c."certificateId", c."issueDate", c.status::text AS status, u.name AS "userName"
`;

export async function listCompassCertificatesForUser(
  userId: string,
): Promise<CompassCertificateView[]> {
  const rows = await prisma.$queryRawUnsafe<CertificateRow[]>(
    `SELECT ${CERTIFICATE_SELECT} ${CERTIFICATE_JOIN}
     WHERE c."userId" = $1
     ORDER BY c."issueDate" DESC`,
    userId,
  );
  return rows.map(mapCertificate);
}

export async function countCompassCertificatesForUser(
  userId: string,
): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "Certificate" WHERE "userId" = ${userId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getCompassCertificateForUser(
  userId: string,
  certificateRowId: string,
): Promise<CompassCertificateView | null> {
  const rows = await prisma.$queryRawUnsafe<CertificateRow[]>(
    `SELECT ${CERTIFICATE_SELECT} ${CERTIFICATE_JOIN}
     WHERE c.id = $1 AND c."userId" = $2
     LIMIT 1`,
    certificateRowId,
    userId,
  );
  return rows[0] ? mapCertificate(rows[0]) : null;
}

export async function getCompassCertificateByPublicId(
  certificateId: string,
): Promise<CompassCertificateView | null> {
  const rows = await prisma.$queryRawUnsafe<CertificateRow[]>(
    `SELECT ${CERTIFICATE_SELECT} ${CERTIFICATE_JOIN}
     WHERE c."certificateId" = $1
     LIMIT 1`,
    certificateId,
  );
  return rows[0] ? mapCertificate(rows[0]) : null;
}
