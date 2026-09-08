import {
  DIMENSION_LABELS,
  type PsycheDimension,
  type ScoreBand,
} from "@/lib/assessments/personality-profile";

export type RankableAttempt = {
  userId: string;
  name: string;
  aptitudePercent: number;
  aptitudeBand: ScoreBand | string;
  quantitativePercent: number;
  quantitativeBand: ScoreBand | string;
  psycheTop: PsycheDimension | string;
  psycheAvg: number;
  completedAt: Date | null;
};

export type RankedAttempt = RankableAttempt & {
  rank: number;
  percentile: number;
  composite: number;
  psycheLabel: string;
};

/** Share of the cohort at or below this rank (1st of 10 → 100). */
export function percentileFromRank(rank: number, total: number) {
  if (total <= 0) return 0;
  if (total === 1) return 100;
  return Math.max(1, Math.min(100, Math.round(((total - rank + 1) / total) * 100)));
}

/** Aptitude 50% + quantitative 40% + psyche intensity 10%. */
export function compositeExamScore(
  aptitudePercent: number,
  quantitativePercent: number,
  psycheAvg: number,
) {
  const psychePct = Math.max(0, Math.min(3, psycheAvg)) / 3 * 100;
  return Math.round((aptitudePercent * 0.5 + quantitativePercent * 0.4 + psychePct * 0.1) * 10) / 10;
}

export function assignRanks(rows: RankableAttempt[]): RankedAttempt[] {
  const sorted = [...rows].sort((a, b) => {
    const ca = compositeExamScore(a.aptitudePercent, a.quantitativePercent, a.psycheAvg);
    const cb = compositeExamScore(b.aptitudePercent, b.quantitativePercent, b.psycheAvg);
    if (cb !== ca) return cb - ca;
    if (b.aptitudePercent !== a.aptitudePercent) return b.aptitudePercent - a.aptitudePercent;
    const ta = a.completedAt?.getTime() ?? 0;
    const tb = b.completedAt?.getTime() ?? 0;
    return ta - tb;
  });
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
    percentile: percentileFromRank(index + 1, sorted.length),
    composite: compositeExamScore(
      row.aptitudePercent,
      row.quantitativePercent,
      row.psycheAvg,
    ),
    psycheLabel:
      DIMENSION_LABELS[row.psycheTop as PsycheDimension] ?? String(row.psycheTop),
  }));
}

export function parseScoredAttempt(value: unknown): {
  aptitudePercent: number;
  aptitudeBand: string;
  quantitativePercent: number;
  quantitativeBand: string;
  psycheTop: string;
  psycheAvg: number;
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const aptitude = raw.aptitude as Record<string, unknown> | undefined;
  const quantitative = raw.quantitative as Record<string, unknown> | undefined;
  const psyche = raw.psyche as Record<string, unknown> | undefined;
  if (typeof aptitude?.percent !== "number" || typeof quantitative?.percent !== "number") {
    return null;
  }
  const drive = typeof psyche?.drive === "number" ? psyche.drive : 0;
  const structure = typeof psyche?.structure === "number" ? psyche.structure : 0;
  const people = typeof psyche?.people === "number" ? psyche.people : 0;
  const risk = typeof psyche?.risk === "number" ? psyche.risk : 0;
  const top = Array.isArray(psyche?.top) ? String(psyche.top[0] ?? "drive") : "drive";
  return {
    aptitudePercent: aptitude.percent,
    aptitudeBand: String(aptitude.band ?? ""),
    quantitativePercent: quantitative.percent,
    quantitativeBand: String(quantitative.band ?? ""),
    psycheTop: top,
    psycheAvg: (drive + structure + people + risk) / 4,
  };
}
