import { prisma } from "@/lib/db";
import {
  assignRanks,
  parseScoredAttempt,
  type RankedAttempt,
} from "@/lib/assessments/personality-rank";

export async function loadPersonalityLeaderboard(
  organizationId: string,
): Promise<RankedAttempt[]> {
  const attempts = await prisma.cliftonAssessment.findMany({
    where: { organizationId, status: "COMPLETED", completedAt: { not: null } },
    select: {
      userId: true,
      domainScores: true,
      completedAt: true,
      user: { select: { name: true } },
    },
    orderBy: { completedAt: "asc" },
  });
  const rows = [];
  for (const attempt of attempts) {
    const scored = parseScoredAttempt(attempt.domainScores);
    if (!scored) continue;
    rows.push({
      userId: attempt.userId,
      name: attempt.user.name,
      aptitudePercent: scored.aptitudePercent,
      aptitudeBand: scored.aptitudeBand,
      quantitativePercent: scored.quantitativePercent,
      quantitativeBand: scored.quantitativeBand,
      psycheTop: scored.psycheTop,
      psycheAvg: scored.psycheAvg,
      completedAt: attempt.completedAt,
    });
  }
  return assignRanks(rows);
}
