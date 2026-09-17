export type IntegrityRisk = "none" | "low" | "medium" | "high";

export type IntegrityMatch = {
  peerSubmissionId: string;
  peerUserId: string;
  peerName: string;
  score: number;
  overlapRatio: number;
  samplePhrases: string[];
};

export type IntegrityReport = {
  scannedAt: string;
  risk: IntegrityRisk;
  score: number;
  peerCount: number;
  matches: IntegrityMatch[];
};

export type IntegritySubmissionInput = {
  id: string;
  userId: string;
  userName: string;
  contentBody: string;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "this",
  "with",
  "from",
  "have",
  "has",
  "was",
  "were",
  "are",
  "been",
  "being",
  "into",
  "onto",
  "about",
  "than",
  "then",
  "them",
  "they",
  "their",
  "there",
  "which",
  "what",
  "when",
  "where",
  "will",
  "would",
  "could",
  "should",
  "also",
  "just",
  "only",
]);

export function normalizeIntegrityText(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function integrityTokens(text: string) {
  return normalizeIntegrityText(text)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP.has(token));
}

function shingles(tokens: string[], size: number) {
  const out = new Set<string>();
  if (tokens.length === 0) return out;
  if (tokens.length < size) {
    out.add(tokens.join(" "));
    return out;
  }
  for (let i = 0; i <= tokens.length - size; i += 1) {
    out.add(tokens.slice(i, i + size).join(" "));
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const item of a) if (b.has(item)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function containment(a: Set<string>, b: Set<string>) {
  if (a.size === 0) return 0;
  let inter = 0;
  for (const item of a) if (b.has(item)) inter += 1;
  return inter / a.size;
}

function samplePhrases(left: string[], rightSet: Set<string>, size: number) {
  const phrases: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length >= size) {
      const phrase = run.join(" ");
      if (!phrases.includes(phrase)) phrases.push(phrase);
    }
    run = [];
  };
  if (left.length < size) return phrases;
  for (let i = 0; i <= left.length - size; i += 1) {
    const gram = left.slice(i, i + size).join(" ");
    if (rightSet.has(gram)) {
      if (run.length === 0) run = left.slice(i, i + size);
      else run.push(left[i + size - 1]!);
    } else {
      flush();
    }
  }
  flush();
  return phrases.slice(0, 3);
}

export function compareIntegrityTexts(a: string, b: string) {
  const left = integrityTokens(a);
  const right = integrityTokens(b);
  const left5 = shingles(left, 5);
  const right5 = shingles(right, 5);
  const left3 = shingles(left, 3);
  const right3 = shingles(right, 3);
  const j5 = jaccard(left5, right5);
  const c5 = Math.max(containment(left5, right5), containment(right5, left5));
  const j3 = jaccard(left3, right3);
  const score = Math.max(j5, c5 * 0.95, j3 * 0.72);
  return {
    score,
    overlapRatio: c5,
    samplePhrases: samplePhrases(left, right5, 5),
  };
}

export function riskFromScore(score: number): IntegrityRisk {
  if (score >= 0.48) return "high";
  if (score >= 0.28) return "medium";
  if (score >= 0.14) return "low";
  return "none";
}

export function buildIntegrityReports(
  submissions: IntegritySubmissionInput[],
  scannedAt = new Date(),
): Map<string, IntegrityReport> {
  const reports = new Map<string, IntegrityReport>();
  for (const current of submissions) {
    const matches: IntegrityMatch[] = [];
    for (const peer of submissions) {
      if (peer.id === current.id || peer.userId === current.userId) continue;
      const compared = compareIntegrityTexts(
        current.contentBody,
        peer.contentBody,
      );
      if (compared.score < 0.14) continue;
      matches.push({
        peerSubmissionId: peer.id,
        peerUserId: peer.userId,
        peerName: peer.userName,
        score: Number(compared.score.toFixed(3)),
        overlapRatio: Number(compared.overlapRatio.toFixed(3)),
        samplePhrases: compared.samplePhrases,
      });
    }
    matches.sort((a, b) => b.score - a.score);
    const top = matches[0]?.score ?? 0;
    reports.set(current.id, {
      scannedAt: scannedAt.toISOString(),
      risk: riskFromScore(top),
      score: Number(top.toFixed(3)),
      peerCount: submissions.filter((item) => item.userId !== current.userId)
        .length,
      matches: matches.slice(0, 5),
    });
  }
  return reports;
}

export function parseIntegrityReport(value: unknown): IntegrityReport | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.scannedAt !== "string") return null;
  if (
    record.risk !== "none" &&
    record.risk !== "low" &&
    record.risk !== "medium" &&
    record.risk !== "high"
  ) {
    return null;
  }
  if (typeof record.score !== "number") return null;
  return record as IntegrityReport;
}
