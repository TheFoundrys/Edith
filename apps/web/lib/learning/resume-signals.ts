import { findCompassCliftonAssessment } from "@/lib/compass/clifton-assessment";
import { findCompassUserProfile } from "@/lib/compass/users";
import type { ProgramTrack } from "@/lib/programs/track";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  extractResumeKeywords,
  type PersonalityKyc,
} from "@/lib/assessments/personality-kyc";
import { resumeSkillLabels } from "@/lib/assessments/personality-profile";
import {
  retrieveForStudent,
  type RetrievedChunk,
} from "@/lib/rag/index";

const RESUME_TRACKS: ProgramTrack[] = [
  "ai",
  "cyber",
  "blockchain",
  "quantum",
  "data",
];

export type ResumeRecommendationContext = {
  keywords: string[];
  skillLabels: string[];
  ragSlugScores: Map<string, number>;
};

function readKyc(aiMetadata: unknown): PersonalityKyc | null {
  if (!aiMetadata || typeof aiMetadata !== "object" || Array.isArray(aiMetadata)) {
    return null;
  }
  const kyc = (aiMetadata as { kyc?: unknown }).kyc;
  if (!kyc || typeof kyc !== "object" || Array.isArray(kyc)) return null;
  return kyc as PersonalityKyc;
}

function uniqueTracks(keywords: string[]) {
  return [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))];
}

/** Query text for embedding retrieval from resume + profile fields. */
export function buildResumeRecommendationQuery(input: {
  keywords: string[];
  skillLabels: string[];
  headline?: string | null;
  careerPath?: string | null;
  bio?: string | null;
  resumeSnippet?: string | null;
}) {
  const parts = [
    ...input.skillLabels,
    ...input.keywords,
    input.headline,
    input.careerPath,
    input.bio,
    input.resumeSnippet?.slice(0, 400),
    "Foundrys programme matching resume skills and career path",
  ]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean);
  return parts.join(" ").slice(0, 800);
}

/** Best catalog retrieval score per programme slug (0–1 normalized). */
export function catalogSlugScoresFromRetrieval(
  chunks: RetrievedChunk[],
): Map<string, number> {
  const raw = new Map<string, number>();
  for (const chunk of chunks) {
    if (chunk.source !== "catalog") continue;
    const slug = chunk.metadata.slug?.trim();
    if (!slug) continue;
    raw.set(slug, Math.max(raw.get(slug) ?? 0, chunk.score));
  }
  const max = Math.max(...raw.values(), 0);
  if (max <= 0) return raw;
  const normalized = new Map<string, number>();
  for (const [slug, score] of raw) {
    normalized.set(slug, score / max);
  }
  return normalized;
}

/** Lift track affinity from coarse resume keyword tracks. */
export function resumeTrackAffinityBoost(keywords: string[]): Partial<
  Record<ProgramTrack, number>
> {
  const boost: Partial<Record<ProgramTrack, number>> = {};
  for (const keyword of keywords) {
    if (!RESUME_TRACKS.includes(keyword as ProgramTrack)) continue;
    const track = keyword as ProgramTrack;
    boost[track] = Math.max(boost[track] ?? 0, 0.55);
  }
  return boost;
}

export async function loadResumeRecommendationContext(
  userId: string,
  organizationId: string,
): Promise<ResumeRecommendationContext> {
  const [attempt, user] = isCompassDatabase()
    ? await Promise.all([
        findCompassCliftonAssessment(userId),
        findCompassUserProfile(userId),
      ])
    : await Promise.all([
        prisma.cliftonAssessment.findFirst({
          where: { userId, organizationId },
          orderBy: { createdAt: "desc" },
          select: { aiMetadata: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { headline: true, careerPath: true, bio: true, name: true },
        }),
      ]);

  const kyc = readKyc(attempt?.aiMetadata);
  const profileText = `${user?.headline ?? ""} ${user?.careerPath ?? ""} ${user?.bio ?? ""} ${user?.name ?? ""}`;
  const keywords = uniqueTracks([
    ...(kyc?.resumeKeywords ?? []),
    ...extractResumeKeywords(
      `${kyc?.resumeText ?? ""} ${profileText}`.trim(),
    ),
  ]);
  const skillLabels = resumeSkillLabels(keywords);

  if (
    keywords.length === 0 &&
    !kyc?.resumeText &&
    !user?.headline &&
    !user?.careerPath
  ) {
    return { keywords: [], skillLabels: [], ragSlugScores: new Map() };
  }

  const query = buildResumeRecommendationQuery({
    keywords,
    skillLabels,
    headline: user?.headline,
    careerPath: user?.careerPath,
    bio: user?.bio,
    resumeSnippet: kyc?.resumeText,
  });

  let ragSlugScores = new Map<string, number>();
  if (!isCompassDatabase()) {
    try {
      const retrieved = await retrieveForStudent({
        organizationId,
        userId,
        query,
        limit: 12,
      });
      ragSlugScores = catalogSlugScoresFromRetrieval(retrieved);
    } catch {
      ragSlugScores = new Map();
    }
  }

  return { keywords, skillLabels, ragSlugScores };
}
