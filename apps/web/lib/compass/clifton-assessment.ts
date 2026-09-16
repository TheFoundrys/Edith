import "server-only";

import { prisma } from "@/lib/db";

export type CompassCliftonAssessment = {
  id: string;
  userId: string;
  responses: unknown;
  aiMetadata: unknown;
  createdAt: Date;
};

/** Compass CliftonAssessment has no organizationId / status columns. */
export async function findCompassCliftonAssessment(
  userId: string,
): Promise<CompassCliftonAssessment | null> {
  const rows = await prisma.$queryRaw<CompassCliftonAssessment[]>`
    SELECT id, "userId", responses, "aiMetadata", "createdAt"
    FROM "CliftonAssessment"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}
