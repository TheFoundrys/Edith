import "server-only";

import { EnrollmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { CompassEnrollmentView } from "@/lib/compass/types";

type EnrollmentRow = {
  id: string;
  userId: string;
  courseId: string | null;
  status: EnrollmentStatus;
  enrolledAt: Date;
  createdAt: Date;
  amountPaid: number;
  unlockedPercentage: number;
};

/** compass_dev has ACTIVE | COMPLETED | DROPPED — map unpaid rows to Edith PENDING. */
function mapEdithEnrollmentStatus(row: EnrollmentRow): EnrollmentStatus {
  if (row.status === "DROPPED") return "CANCELLED";
  if (
    row.status === "ACTIVE" &&
    row.unlockedPercentage === 0 &&
    row.amountPaid === 0
  ) {
    return "PENDING";
  }
  return row.status;
}

function mapEnrollment(row: EnrollmentRow): CompassEnrollmentView {
  return {
    id: row.id,
    userId: row.userId,
    programId: row.courseId ?? "",
    organizationId: "",
    status: mapEdithEnrollmentStatus(row),
    enrolledAt: row.enrolledAt,
    createdAt: row.createdAt,
    amountPaid: row.amountPaid,
    payments: [],
  };
}

const ENROLLMENT_SELECT = `
  id, "userId", "courseId", status,
  "createdAt" AS "enrolledAt", "createdAt", "amountPaid", "unlockedPercentage"
`;

const COMPASS_DB_STATUSES = ["ACTIVE", "COMPLETED", "DROPPED"] as const;

function matchesRequestedStatuses(
  row: EnrollmentRow,
  statuses: EnrollmentStatus[],
): boolean {
  const mapped = mapEdithEnrollmentStatus(row);
  return statuses.includes(mapped);
}

export async function findCompassEnrollmentById(
  userId: string,
  enrollmentId: string,
): Promise<CompassEnrollmentView | null> {
  const rows = await prisma.$queryRawUnsafe<EnrollmentRow[]>(
    `SELECT ${ENROLLMENT_SELECT}
     FROM "Enrollment"
     WHERE id = $1 AND "userId" = $2
     LIMIT 1`,
    enrollmentId,
    userId,
  );
  return rows[0] ? mapEnrollment(rows[0]) : null;
}

export async function findCompassEnrollment(
  userId: string,
  courseId: string,
): Promise<CompassEnrollmentView | null> {
  const rows = await prisma.$queryRawUnsafe<EnrollmentRow[]>(
    `SELECT ${ENROLLMENT_SELECT}
     FROM "Enrollment"
     WHERE "userId" = $1 AND "courseId" = $2
     LIMIT 1`,
    userId,
    courseId,
  );
  return rows[0] ? mapEnrollment(rows[0]) : null;
}

export async function findCompassActiveEnrollment(
  userId: string,
  courseId: string,
): Promise<CompassEnrollmentView | null> {
  const rows = await prisma.$queryRawUnsafe<EnrollmentRow[]>(
    `SELECT ${ENROLLMENT_SELECT}
     FROM "Enrollment"
     WHERE "userId" = $1
       AND "courseId" = $2
       AND (
         status = 'COMPLETED'
         OR (
           status = 'ACTIVE'
           AND NOT ("unlockedPercentage" = 0 AND "amountPaid" = 0)
         )
       )
     LIMIT 1`,
    userId,
    courseId,
  );
  return rows[0] ? mapEnrollment(rows[0]) : null;
}

export async function listCompassEnrollmentsForUser(
  userId: string,
  statuses: EnrollmentStatus[] = ["ACTIVE", "PENDING"],
): Promise<CompassEnrollmentView[]> {
  const rows = await prisma.$queryRaw<EnrollmentRow[]>`
    SELECT id, "userId", "courseId", status,
      "createdAt" AS "enrolledAt", "createdAt", "amountPaid", "unlockedPercentage"
    FROM "Enrollment"
    WHERE "userId" = ${userId}
      AND status::text IN (${Prisma.join([...COMPASS_DB_STATUSES])})
      AND "courseId" IS NOT NULL
    ORDER BY "createdAt" DESC
  `;
  return rows
    .filter((row) => matchesRequestedStatuses(row, statuses))
    .map(mapEnrollment);
}

export async function countCompassEnrollments(
  courseId: string,
  excludeUserId?: string,
): Promise<number> {
  const rows = excludeUserId
    ? await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Enrollment"
        WHERE "courseId" = ${courseId}
          AND "userId" <> ${excludeUserId}
          AND status IN ('ACTIVE', 'COMPLETED')
      `
    : await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Enrollment"
        WHERE "courseId" = ${courseId}
          AND status IN ('ACTIVE', 'COMPLETED')
      `;
  return Number(rows[0]?.count ?? 0);
}

export async function upsertCompassEnrollmentActive(
  userId: string,
  courseId: string,
): Promise<CompassEnrollmentView> {
  const existing = await findCompassEnrollment(userId, courseId);
  if (existing?.status === "ACTIVE" || existing?.status === "COMPLETED") {
    return existing;
  }

  if (existing) {
    await prisma.$executeRaw`
      UPDATE "Enrollment"
      SET status = 'ACTIVE',
          "updatedAt" = NOW(),
          "lastAccessedAt" = NOW(),
          "unlockedPercentage" = 100
      WHERE id = ${existing.id}
    `;
    return {
      ...existing,
      status: "ACTIVE",
      enrolledAt: existing.enrolledAt,
    };
  }

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  await prisma.$executeRaw`
    INSERT INTO "Enrollment" (
      id, "userId", "courseId", status,
      "createdAt", "updatedAt", "lastAccessedAt",
      "totalLearningMinutes", "amountPaid", "unlockedPercentage"
    ) VALUES (
      ${id}, ${userId}, ${courseId}, 'ACTIVE',
      NOW(), NOW(), NOW(), 0, 0, 100
    )
  `;
  const created = await findCompassEnrollment(userId, courseId);
  if (!created) throw new Error("Failed to create enrollment.");
  return created;
}

export async function upsertCompassEnrollmentPending(
  userId: string,
  courseId: string,
): Promise<CompassEnrollmentView> {
  const existing = await findCompassEnrollment(userId, courseId);
  if (existing) return existing;

  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
  await prisma.$executeRaw`
    INSERT INTO "Enrollment" (
      id, "userId", "courseId", status,
      "createdAt", "updatedAt", "lastAccessedAt",
      "totalLearningMinutes", "amountPaid", "unlockedPercentage"
    ) VALUES (
      ${id}, ${userId}, ${courseId}, 'ACTIVE',
      NOW(), NOW(), NOW(), 0, 0, 0
    )
  `;
  const created = await findCompassEnrollment(userId, courseId);
  if (!created) throw new Error("Failed to create enrollment.");
  return created;
}

export async function listCompassActiveEnrollmentCounts(): Promise<
  Map<string, number>
> {
  const rows = await prisma.$queryRaw<{ courseId: string; count: bigint }[]>`
    SELECT "courseId", COUNT(*)::bigint AS count
    FROM "Enrollment"
    WHERE status = 'ACTIVE' AND "courseId" IS NOT NULL
    GROUP BY "courseId"
  `;
  return new Map(rows.map((row) => [row.courseId, Number(row.count)]));
}

export async function activateCompassEnrollment(enrollmentId: string) {
  await prisma.$executeRaw`
    UPDATE "Enrollment"
    SET status = 'ACTIVE',
        "updatedAt" = NOW(),
        "lastAccessedAt" = NOW(),
        "unlockedPercentage" = 100
    WHERE id = ${enrollmentId}
  `;
}
