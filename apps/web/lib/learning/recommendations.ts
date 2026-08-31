import type { DegreeLevel, ProgramCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { loadPublishedCatalogPrograms } from "@/lib/catalog/service";
import { flattenPublishedActivities } from "@/lib/learning/outline";
import { displayProgramName } from "@/lib/programs/categories";
import { catalogDurationLabel } from "@/lib/programs/catalog-meta";
import {
  inferExperienceTier,
  inferProgramTrack,
  TRACK_LABELS,
  type ProgramTrack,
} from "@/lib/programs/track";

export type CourseRecommendation = {
  id: string;
  title: string;
  slug: string;
  href: string;
  category: ProgramCategory;
  durationLabel: string;
  reason: string;
  track: ProgramTrack;
  score: number;
};

type ScoredCandidate = CourseRecommendation & {
  reasons: string[];
};

type LearnerProfile = {
  enrolledIds: Set<string>;
  trackAffinity: Record<ProgramTrack, number>;
  categoryAffinity: Record<string, number>;
  tagWeights: Map<string, number>;
  completedTracks: Set<ProgramTrack>;
  entryTracks: Set<ProgramTrack>;
  professionalTracks: Set<ProgramTrack>;
  hasHistory: boolean;
};

const TRACK_KEYS: ProgramTrack[] = [
  "ai",
  "cyber",
  "blockchain",
  "quantum",
  "data",
  "general",
];

function emptyTrackAffinity(): Record<ProgramTrack, number> {
  return Object.fromEntries(TRACK_KEYS.map((track) => [track, 0])) as Record<
    ProgramTrack,
    number
  >;
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((tag) => tag.toLowerCase()));
  const setB = new Set(b.map((tag) => tag.toLowerCase()));
  let intersection = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function buildReason(reasons: string[]): string {
  if (reasons.length === 0) return "Recommended for your learning path";
  return reasons[0];
}

function scoreCandidate(
  candidate: {
    id: string;
    title: string;
    slug: string;
    category: ProgramCategory;
    domainSlug: string | null;
    tags: string[];
    duration: string | null;
    degreeLevel: DegreeLevel;
    eligibilitySummary: string | null;
    campus: { name: string } | null;
    enrollmentCount: number;
    maxEnrollmentCount: number;
  },
  profile: LearnerProfile,
): ScoredCandidate {
  const track = inferProgramTrack(candidate);
  const tier = inferExperienceTier(candidate.domainSlug, candidate.category);
  const displayName = displayProgramName(candidate.title, candidate.category);
  const durationLabel = catalogDurationLabel({
    slug: candidate.slug,
    category: candidate.category,
    degreeLevel: candidate.degreeLevel as DegreeLevel,
    eligibilitySummary: candidate.eligibilitySummary,
    campus: candidate.campus,
    duration: candidate.duration,
  });

  const reasons: string[] = [];
  let score = 0;

  const trackWeight = profile.trackAffinity[track] ?? 0;
  if (trackWeight > 0) {
    const trackScore = trackWeight * 40;
    score += trackScore;
    if (trackScore >= 12) {
      reasons.push(`Builds on your ${TRACK_LABELS[track]} learning`);
    }
  }

  const categoryWeight = profile.categoryAffinity[candidate.category] ?? 0;
  if (categoryWeight > 0) {
    score += categoryWeight * 15;
    if (categoryWeight >= 0.35 && reasons.length === 0) {
      reasons.push("Matches your enrolled programme type");
    }
  }

  const profileTags = [...profile.tagWeights.keys()];
  const tagOverlap = jaccard(profileTags, candidate.tags);
  if (tagOverlap > 0) {
    score += tagOverlap * 20;
    if (tagOverlap >= 0.2) {
      reasons.push("Similar topics to courses you've taken");
    }
  }

  if (
    tier === "professional" &&
    profile.entryTracks.has(track) &&
    !profile.professionalTracks.has(track)
  ) {
    score += 28;
    reasons.unshift(`Natural next step in ${TRACK_LABELS[track]}`);
  }

  if (
    tier === "entry" &&
    !profile.hasHistory &&
    track !== "general"
  ) {
    score += 18;
    reasons.push(`Strong starting point in ${TRACK_LABELS[track]}`);
  }

  if (profile.completedTracks.has(track) && tier === "professional") {
    score += 12;
    if (!reasons.some((reason) => reason.includes("next step"))) {
      reasons.push(`Advance your ${TRACK_LABELS[track]} skills`);
    }
  }

  if (candidate.enrollmentCount > 0 && candidate.maxEnrollmentCount > 0) {
    const popularity = candidate.enrollmentCount / candidate.maxEnrollmentCount;
    score += popularity * 10;
    if (popularity >= 0.55 && reasons.length === 0) {
      reasons.push("Popular with learners on Edith");
    }
  }

  if (reasons.length === 0) {
    reasons.push("Explore a new area of deep tech");
  }

  return {
    id: candidate.id,
    title: displayName,
    slug: candidate.slug,
    href: `/courses/${candidate.slug}`,
    category: candidate.category,
    durationLabel,
    track,
    score,
    reason: buildReason(reasons),
    reasons,
  };
}

function selectDiverse(items: ScoredCandidate[], limit: number): ScoredCandidate[] {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const selected: ScoredCandidate[] = [];
  const trackCounts = new Map<ProgramTrack, number>();

  for (const item of sorted) {
    if (selected.length >= limit) break;

    const count = trackCounts.get(item.track) ?? 0;
    const maxPerTrack = limit <= 4 ? 2 : 3;
    if (count >= maxPerTrack && selected.length >= Math.ceil(limit / 2)) {
      continue;
    }

    selected.push(item);
    trackCounts.set(item.track, count + 1);
  }

  if (selected.length < limit) {
    for (const item of sorted) {
      if (selected.length >= limit) break;
      if (!selected.some((picked) => picked.id === item.id)) {
        selected.push(item);
      }
    }
  }

  return selected;
}

async function buildLearnerProfile(
  userId: string,
  organizationId: string,
): Promise<{
  profile: LearnerProfile;
  completedLessonIds: Set<string>;
}> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      organizationId,
      status: { in: ["ACTIVE", "COMPLETED"] },
    },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          category: true,
          domainSlug: true,
          tags: true,
          syllabus: {
            select: {
              status: true,
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    where: { isPublished: true },
                    orderBy: { order: "asc" },
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const lessonIds = enrollments.flatMap((enrollment) =>
    enrollment.program.syllabus?.status === "PUBLISHED"
      ? flattenPublishedActivities(enrollment.program.syllabus.modules).map(
          (activity) => activity.id,
        )
      : [],
  );

  const completedRows =
    lessonIds.length > 0
      ? await prisma.lessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completedAt: { not: null },
          },
          select: { lessonId: true },
        })
      : [];

  const completedLessonIds = new Set(completedRows.map((row) => row.lessonId));

  const profile: LearnerProfile = {
    enrolledIds: new Set(enrollments.map((enrollment) => enrollment.program.id)),
    trackAffinity: emptyTrackAffinity(),
    categoryAffinity: {},
    tagWeights: new Map(),
    completedTracks: new Set(),
    entryTracks: new Set(),
    professionalTracks: new Set(),
    hasHistory: enrollments.length > 0,
  };

  for (const enrollment of enrollments) {
    const program = enrollment.program;
    const track = inferProgramTrack(program);
    const tier = inferExperienceTier(program.domainSlug, program.category);

    const activities =
      program.syllabus?.status === "PUBLISHED"
        ? flattenPublishedActivities(program.syllabus.modules)
        : [];
    const done = activities.filter((activity) =>
      completedLessonIds.has(activity.id),
    ).length;
    const progress =
      activities.length === 0 ? 0 : done / Math.max(activities.length, 1);
    const engagement = 0.45 + progress * 0.55;

    profile.trackAffinity[track] = (profile.trackAffinity[track] ?? 0) + engagement;
    profile.categoryAffinity[program.category] =
      (profile.categoryAffinity[program.category] ?? 0) + engagement;

    for (const tag of program.tags) {
      const key = normalizeTag(tag);
      profile.tagWeights.set(key, (profile.tagWeights.get(key) ?? 0) + engagement);
    }

    if (progress >= 0.99) {
      profile.completedTracks.add(track);
    }
    if (tier === "entry") profile.entryTracks.add(track);
    if (tier === "professional") profile.professionalTracks.add(track);
  }

  const maxTrack = Math.max(...Object.values(profile.trackAffinity), 1);
  for (const track of TRACK_KEYS) {
    profile.trackAffinity[track] = (profile.trackAffinity[track] ?? 0) / maxTrack;
  }

  const maxCategory = Math.max(...Object.values(profile.categoryAffinity), 1);
  for (const category of Object.keys(profile.categoryAffinity)) {
    profile.categoryAffinity[category] =
      (profile.categoryAffinity[category] ?? 0) / maxCategory;
  }

  return { profile, completedLessonIds };
}

export async function getCourseRecommendationsForUser(
  userId: string,
  options: { organizationId: string; limit?: number },
): Promise<CourseRecommendation[]> {
  const limit = options?.limit ?? 8;
  const { profile } = await buildLearnerProfile(
    userId,
    options.organizationId,
  );

  const [published, enrollmentCounts] = await Promise.all([
    loadPublishedCatalogPrograms({ organizationId: options.organizationId }),
    prisma.enrollment.groupBy({
      by: ["programId"],
      where: { organizationId: options.organizationId, status: "ACTIVE" },
      _count: { programId: true },
    }),
  ]);

  const countByProgram = new Map(
    enrollmentCounts.map((row) => [row.programId, row._count.programId]),
  );
  const maxEnrollmentCount = Math.max(...countByProgram.values(), 1);

  const candidates = published
    .filter((program) => !profile.enrolledIds.has(program.id))
    .map((program) =>
      scoreCandidate(
        {
          ...program,
          enrollmentCount: countByProgram.get(program.id) ?? 0,
          maxEnrollmentCount,
        },
        profile,
      ),
    );

  return selectDiverse(candidates, limit).map((candidate) => {
    const { reasons, ...item } = candidate;
    void reasons;
    return item;
  });
}
