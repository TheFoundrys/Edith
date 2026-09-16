import "server-only";

import { prisma } from "@/lib/db";

function toCount(value: bigint | number | undefined) {
  return Number(value ?? 0);
}

export async function countCompassStaffUsers(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "User"
    WHERE role IS NOT NULL
      AND LOWER(role) NOT IN ('learner', 'student')
  `;
  return toCount(rows[0]?.count);
}

export async function countCompassLearnerUsers(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "User"
    WHERE role IS NULL
      OR LOWER(role) IN ('learner', 'student')
  `;
  return toCount(rows[0]?.count);
}

export async function countCompassTotalUsers(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "User"
  `;
  return toCount(rows[0]?.count);
}

export async function countCompassTotalEnrollments(
  status?: "COMPLETED",
): Promise<number> {
  const rows = status
    ? await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Enrollment"
        WHERE status = 'COMPLETED'
      `
    : await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Enrollment"
      `;
  return toCount(rows[0]?.count);
}

export async function countCompassDistinctLearners(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT "userId")::bigint AS count
    FROM "Enrollment"
    WHERE status IN ('ACTIVE', 'COMPLETED')
  `;
  return toCount(rows[0]?.count);
}

export async function countCompassTotalCertificates(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "Certificate"
  `;
  return toCount(rows[0]?.count);
}

export async function fetchCompassRecentLearnerAvatars(limit: number) {
  const rows = await prisma.$queryRaw<
    { name: string; image: string | null }[]
  >`
    SELECT DISTINCT ON (e."userId") u.name, u.image
    FROM "Enrollment" e
    INNER JOIN "User" u ON u.id = e."userId"
    WHERE e.status IN ('ACTIVE', 'COMPLETED')
    ORDER BY e."userId", e."createdAt" DESC
    LIMIT ${limit}
  `;
  return rows;
}

export type CompassUserRow = {
  role: string | null;
  createdAt: Date;
};

export async function listCompassUsersForStats(): Promise<CompassUserRow[]> {
  return prisma.$queryRaw<CompassUserRow[]>`
    SELECT role, "createdAt" FROM "User"
  `;
}

export type CompassEnrollmentStatsRow = {
  id: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  userName: string;
  userEmail: string;
  courseId: string | null;
  courseTitle: string | null;
};

export async function listCompassEnrollmentsForStats(): Promise<
  CompassEnrollmentStatsRow[]
> {
  return prisma.$queryRaw<CompassEnrollmentStatsRow[]>`
    SELECT e.id, e.status::text AS status, e."createdAt", e."completedAt",
      u.name AS "userName", u.email AS "userEmail",
      c.id AS "courseId", c.title AS "courseTitle"
    FROM "Enrollment" e
    INNER JOIN "User" u ON u.id = e."userId"
    LEFT JOIN "Course" c ON c.id = e."courseId"
    ORDER BY e."createdAt" DESC
  `;
}

export type CompassTransactionStatsRow = {
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
};

export async function listCompassPaidTransactions(): Promise<
  CompassTransactionStatsRow[]
> {
  return prisma.$queryRaw<CompassTransactionStatsRow[]>`
    SELECT amount, currency, status::text AS status, "createdAt"
    FROM "Transaction"
    WHERE UPPER(status::text) IN ('PAID', 'SUCCESS', 'COMPLETED')
  `;
}
