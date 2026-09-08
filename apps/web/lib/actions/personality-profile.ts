"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import {
  buildKryptonMcqPaper,
  kryptonSeed,
  originalOptionIndex,
  type KryptonMcqPaper,
} from "@/lib/assessments/krypton";
import { loadPersonalityLeaderboard } from "@/lib/assessments/personality-board";
import {
  extractResumeKeywords,
  hasPanOnFile,
  hasResumeOnFile,
  isAadhaarVerified,
  isIdentityComplete,
  isKycComplete,
  isResumeComplete,
  parsePan,
  personalityWizardStep,
  recordEnteredAadhaar,
  unlinkAadhaarFromKyc,
  type PersonalityKyc,
} from "@/lib/assessments/personality-kyc";
import {
  allExamQuestionIds,
  LIKERT_OPTIONS,
  PERSONALITY_EXAM_HREF,
  PERSONALITY_EXAM_QUESTION_COUNT,
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_SECTIONS,
  PSYCHE_QUESTIONS,
  SECTION_QUESTIONS,
  batteryForQuestionId,
  buildPersonalityReport,
  catalogHrefForProgram,
  isPersonalityExamComplete,
  personalityProgress,
  questionsForExam,
  recommendedAssessExam,
  resumeRecommendations,
  resumeSkillLabels,
  splitExamAnswers,
  type PersonalityRecommendation,
  type PersonalityResponses,
} from "@/lib/assessments/personality-profile";
import { displayProgramName } from "@/lib/programs/categories";
import { prisma } from "@/lib/db";
import { jsonWithoutNul } from "@/lib/db/pg-json";
import { groundedStudentGuidance, trainerBrief } from "@/lib/rag/advise";
import {
  indexExamChunks,
  indexProfileChunks,
  indexResumeChunks,
  retrieveForStudent,
} from "@/lib/rag/index";
import { extractResumeText } from "@/lib/rag/resume-text";
import { readStoredUpload, saveApplicationDocument } from "@/lib/storage";
import {
  loadPersonalityProgram,
  persistAadhaarRecord,
} from "@/lib/digilocker/persist";
import { digilockerConfigured } from "@/lib/digilocker/client";

type AttemptMeta = {
  kyc?: PersonalityKyc;
  papers?: Record<string, KryptonMcqPaper>;
  examPaper?: KryptonMcqPaper;
};

function parseResponses(value: unknown): PersonalityResponses {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const pick = (key: keyof PersonalityResponses) => {
    const entry = raw[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const out: Record<string, number> = {};
    for (const [id, answer] of Object.entries(entry as Record<string, unknown>)) {
      if (typeof answer === "number" && Number.isInteger(answer)) out[id] = answer;
    }
    return Object.keys(out).length ? out : undefined;
  };
  return {
    aptitude: pick("aptitude"),
    quantitative: pick("quantitative"),
    psyche: pick("psyche"),
  };
}

function parseMeta(value: unknown): AttemptMeta {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as AttemptMeta;
  const kyc = raw.kyc;
  const keptKyc =
    kyc && typeof kyc === "object" && !Array.isArray(kyc) ? kyc : undefined;
  return {
    kyc: keptKyc,
    papers: raw.papers ?? {},
    examPaper: isPaper(raw.examPaper) ? raw.examPaper : undefined,
  };
}

function isPaper(value: unknown): value is KryptonMcqPaper {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const paper = value as KryptonMcqPaper;
  return Array.isArray(paper.questionIds) && Boolean(paper.optionMaps);
}

function parseInsights(value: unknown): {
  insights?: string[];
  recommendations?: PersonalityRecommendation[];
  ragGuidance?: string[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as {
    insights?: string[];
    recommendations?: PersonalityRecommendation[];
    ragGuidance?: string[];
  };
}

async function loadProfileProgram(organizationId: string) {
  const access = await loadPersonalityProgram(organizationId);
  if ("error" in access) return null;
  return access.program;
}

async function loadEnrollment(userId: string, programId: string) {
  return prisma.enrollment.findFirst({
    where: { userId, programId, status: "ACTIVE" },
    select: { id: true },
  });
}

async function loadOrCreateAttempt(organizationId: string, userId: string) {
  const existing = await prisma.cliftonAssessment.findFirst({
    where: { organizationId, userId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;
  return prisma.cliftonAssessment.create({
    data: {
      organizationId,
      userId,
      status: "PENDING",
      responses: {},
      aiMetadata: {},
    },
  });
}

function revalidatePersonality() {
  revalidatePath(PERSONALITY_PROFILE_HREF);
  revalidatePath(PERSONALITY_EXAM_HREF);
  revalidatePath(`${PERSONALITY_PROFILE_HREF}/report`);
  revalidatePath(`${PERSONALITY_PROFILE_HREF}/rank`);
  revalidatePath("/personality-profile/rank");
  revalidatePath("/admin/personality-profile");
  revalidatePath("/student/assessments");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/my-courses");
  revalidatePath("/student/profile");
  revalidatePath("/student/recommendations");
  revalidatePath("/student/certificates");
}

async function hydrateRecs(
  organizationId: string,
  recs: PersonalityRecommendation[],
) {
  if (!recs.length) return [];
  const programs = await prisma.program.findMany({
    where: {
      organizationId,
      slug: { in: recs.map((item) => item.slug) },
      status: "PUBLISHED",
    },
    select: { slug: true, title: true, category: true },
  });
  const bySlug = new Map(programs.map((program) => [program.slug, program]));
  return recs.map((item) => {
    const program = bySlug.get(item.slug);
    return {
      slug: item.slug,
      reason: item.reason,
      title: program
        ? displayProgramName(program.title, program.category)
        : item.slug,
      href: catalogHrefForProgram({ slug: item.slug }),
    };
  });
}

async function indexStudentGraph(input: {
  organizationId: string;
  userId: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  careerPath?: string | null;
  resumeText?: string;
  examSummary?: string;
}) {
  try {
    if (input.resumeText) {
      await indexResumeChunks({
        organizationId: input.organizationId,
        userId: input.userId,
        text: input.resumeText,
      });
    }
    await indexProfileChunks({
      organizationId: input.organizationId,
      userId: input.userId,
      name: input.name,
      headline: input.headline,
      bio: input.bio,
      careerPath: input.careerPath,
    });
    if (input.examSummary) {
      await indexExamChunks({
        organizationId: input.organizationId,
        userId: input.userId,
        summary: input.examSummary,
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function getPersonalityProfileWorkspace() {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }

  const enrollment = await loadEnrollment(session.user.id, program.id);
  const attempt = await prisma.cliftonAssessment.findFirst({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });
  const responses = parseResponses(attempt?.responses);
  const meta = parseMeta(attempt?.aiMetadata);
  const progress = personalityProgress(responses);
  const examComplete = isPersonalityExamComplete(responses);
  const identity = isIdentityComplete(meta.kyc);
  const resume = isResumeComplete(meta.kyc);
  const keywords = meta.kyc?.resumeKeywords ?? [];
  const report =
    attempt?.status === "COMPLETED" && examComplete
      ? buildPersonalityReport(responses, {
          resumeKeywords: keywords,
        })
      : null;
  const insights = parseInsights(attempt?.personalizedInsights);
  const keywordRecs = resumeRecommendations(keywords);
  const resumeRecs = await hydrateRecs(session.user.organizationId, keywordRecs);
  const board = examComplete
    ? await loadPersonalityLeaderboard(session.user.organizationId)
    : [];
  const rank = board.find((row) => row.userId === session.user.id) ?? null;

  return {
    ok: true as const,
    programTitle: program.title,
    enrolled: Boolean(enrollment),
    progress,
    report,
    ragGuidance: insights.ragGuidance ?? [],
    resumeRecs,
    resumeKeywords: keywords,
    resumeSkills: resumeSkillLabels(keywords),
    recommendedExam: recommendedAssessExam(keywords),
    rank: rank
      ? {
          place: rank.rank,
          total: board.length,
          percentile: rank.percentile,
          composite: rank.composite,
          aptitudePercent: rank.aptitudePercent,
          aptitudeBand: String(rank.aptitudeBand),
          quantitativePercent: rank.quantitativePercent,
          quantitativeBand: String(rank.quantitativeBand),
          psycheLabel: rank.psycheLabel,
        }
      : null,
    wizard: {
      step: personalityWizardStep({
        identity,
        resume,
        exam: examComplete,
      }),
      identity,
      resume,
      exam: examComplete,
    },
    aadhaar: isAadhaarVerified(meta.kyc) && meta.kyc
      ? {
          mask: meta.kyc.aadhaarMask,
          name: meta.kyc.aadhaarName ?? null,
          source: meta.kyc.aadhaarSource,
        }
      : null,
    pan: hasPanOnFile(meta.kyc) && meta.kyc
      ? { mask: meta.kyc.panMask as string }
      : null,
    canUnlinkAadhaar: Boolean(isAadhaarVerified(meta.kyc) && !examComplete),
    resumeOnFile: hasResumeOnFile(meta.kyc),
    digilockerAvailable: digilockerConfigured(),
    kyc: isKycComplete(meta.kyc)
      ? {
          panMask: meta.kyc.panMask,
          aadhaarMask: meta.kyc.aadhaarMask,
          resumeFileName: meta.kyc.resumeFileName,
        }
      : null,
    status: attempt?.status ?? "PENDING",
    batteries: PERSONALITY_SECTIONS.map((section) => ({
      ...section,
      questionCount: SECTION_QUESTIONS[section.id].length,
    })),
  };
}

function paperForExam(
  attemptId: string,
  existing: KryptonMcqPaper | undefined,
): KryptonMcqPaper {
  if (
    isPaper(existing) &&
    existing.questionIds.length === PERSONALITY_EXAM_QUESTION_COUNT
  ) {
    return existing;
  }

  const ids = allExamQuestionIds();
  const optionCounts: Record<string, number> = {};
  for (const question of SECTION_QUESTIONS.aptitude) {
    optionCounts[question.id] = question.options.length;
  }
  for (const question of SECTION_QUESTIONS.quantitative) {
    optionCounts[question.id] = question.options.length;
  }
  for (const question of PSYCHE_QUESTIONS) {
    optionCounts[question.id] = LIKERT_OPTIONS.length;
  }

  const paper = buildKryptonMcqPaper(
    ids,
    optionCounts,
    kryptonSeed(attemptId, "exam"),
    true,
  );
  for (const question of PSYCHE_QUESTIONS) {
    paper.optionMaps[question.id] = Array.from(
      { length: LIKERT_OPTIONS.length },
      (_, index) => index,
    );
  }
  return paper;
}

export async function getPersonalityExam() {
  const session = await requireStudent();
  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) return workspace;
  if (!workspace.enrolled) {
    return {
      ok: false as const,
      error: "Enroll for ₹3,500 + GST before sitting the exam.",
    };
  }
  if (!workspace.kyc) {
    return {
      ok: false as const,
      error: "Complete Aadhaar, PAN and resume before the exam.",
    };
  }

  const attempt = await loadOrCreateAttempt(
    session.user.organizationId,
    session.user.id,
  );
  const meta = parseMeta(attempt.aiMetadata);
  const paper = paperForExam(attempt.id, meta.examPaper);
  if (!isPaper(meta.examPaper) || meta.examPaper.questionIds.length !== paper.questionIds.length) {
    await prisma.cliftonAssessment.update({
      where: { id: attempt.id },
      data: {
        aiMetadata: jsonWithoutNul({
          ...meta,
          examPaper: paper,
        }) as Prisma.InputJsonValue,
      },
    });
  }

  return {
    ok: true as const,
    done: isPersonalityExamComplete(parseResponses(attempt.responses)),
    questions: questionsForExam(paper),
  };
}

export async function unlinkPersonalityAadhaar() {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }

  const attempt = await prisma.cliftonAssessment.findFirst({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });
  if (!attempt) {
    return { ok: false as const, error: "No Aadhaar is linked." };
  }

  const responses = parseResponses(attempt.responses);
  if (isPersonalityExamComplete(responses) || attempt.status === "COMPLETED") {
    return {
      ok: false as const,
      error: "Aadhaar is locked after the exam. It cannot be unlinked.",
    };
  }

  const meta = parseMeta(attempt.aiMetadata);
  if (!isAadhaarVerified(meta.kyc)) {
    return { ok: false as const, error: "No Aadhaar is linked." };
  }

  const kyc = unlinkAadhaarFromKyc(meta.kyc);
  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      aiMetadata: jsonWithoutNul({ ...meta, kyc }) as Prisma.InputJsonValue,
    },
  });

  revalidatePersonality();
  return { ok: true as const };
}

export async function savePersonalityAadhaar(formData: FormData) {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }

  const attempt = await prisma.cliftonAssessment.findFirst({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });
  if (
    attempt &&
    (isPersonalityExamComplete(parseResponses(attempt.responses)) ||
      attempt.status === "COMPLETED")
  ) {
    return {
      ok: false as const,
      error: "Aadhaar is locked after the exam.",
    };
  }

  const recorded = recordEnteredAadhaar(String(formData.get("aadhaar") ?? ""));
  if ("error" in recorded) return { ok: false as const, error: recorded.error };

  const saved = await persistAadhaarRecord({
    userId: session.user.id,
    organizationId: session.user.organizationId,
    recorded,
  });
  if ("error" in saved) return { ok: false as const, error: saved.error };

  revalidatePersonality();
  return { ok: true as const };
}

export async function savePersonalityIdentity(formData: FormData) {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }

  const existing = await prisma.cliftonAssessment.findFirst({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });
  if (
    existing &&
    (isPersonalityExamComplete(parseResponses(existing.responses)) ||
      existing.status === "COMPLETED")
  ) {
    return {
      ok: false as const,
      error: "Identity is locked after the exam.",
    };
  }

  const meta = parseMeta(existing?.aiMetadata);
  if (!isAadhaarVerified(meta.kyc)) {
    const recorded = recordEnteredAadhaar(String(formData.get("aadhaar") ?? ""));
    if ("error" in recorded) return { ok: false as const, error: recorded.error };
    const saved = await persistAadhaarRecord({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      recorded,
    });
    if ("error" in saved) return { ok: false as const, error: saved.error };
  }

  const pan = parsePan(String(formData.get("pan") ?? ""));
  if ("error" in pan) return { ok: false as const, error: pan.error };

  const attempt = await loadOrCreateAttempt(
    session.user.organizationId,
    session.user.id,
  );
  const nextMeta = parseMeta(attempt.aiMetadata);
  if (!isAadhaarVerified(nextMeta.kyc)) {
    return { ok: false as const, error: "Verify Aadhaar before saving PAN." };
  }

  const kyc: PersonalityKyc = {
    ...nextMeta.kyc,
    panMask: pan.panMask,
    panHash: pan.panHash,
  };

  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      status: attempt.status === "PENDING" ? "IN_PROGRESS" : attempt.status,
      aiMetadata: jsonWithoutNul({ ...nextMeta, kyc }) as Prisma.InputJsonValue,
    },
  });

  revalidatePersonality();
  return { ok: true as const };
}

export async function savePersonalityKyc(formData: FormData) {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return { ok: false as const, error: "Upload a resume (PDF or Word)." };
  }
  const stored = await saveApplicationDocument(resume);
  if ("error" in stored) return { ok: false as const, error: stored.error };

  const buffer = await readStoredUpload(stored.storagePath);
  const extracted = buffer
    ? extractResumeText(buffer, stored.fileName, stored.mimeType)
    : "";
  const skills = String(formData.get("skills") ?? "");
  const resumeText = `${extracted} ${skills} ${stored.fileName}`.trim();
  const resumeKeywords = extractResumeKeywords(
    `${resumeText} ${session.user.name}`,
  );

  const attempt = await loadOrCreateAttempt(
    session.user.organizationId,
    session.user.id,
  );
  const meta = parseMeta(attempt.aiMetadata);
  if (!isIdentityComplete(meta.kyc)) {
    return {
      ok: false as const,
      error: "Complete Aadhaar and PAN before uploading a resume.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { headline: true, careerPath: true, bio: true, name: true },
  });
  const indexed = await indexStudentGraph({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    name: user?.name ?? session.user.name,
    headline: user?.headline,
    bio: user?.bio,
    careerPath: user?.careerPath,
    resumeText,
  });

  const kyc: PersonalityKyc = {
    ...meta.kyc,
    resumePath: stored.storagePath,
    resumeFileName: stored.fileName,
    resumeKeywords,
    resumeText: resumeText.slice(0, 12000),
    indexedAt: indexed ? new Date().toISOString() : undefined,
    completedAt: new Date().toISOString(),
  };

  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      status: attempt.status === "PENDING" ? "IN_PROGRESS" : attempt.status,
      aiMetadata: jsonWithoutNul({ ...meta, kyc }) as Prisma.InputJsonValue,
    },
  });

  revalidatePersonality();
  return { ok: true as const };
}

export async function submitPersonalityExam(answers: Record<string, number>) {
  const session = await requireStudent();
  const program = await loadProfileProgram(session.user.organizationId);
  if (!program) {
    return { ok: false as const, error: "Personality Profile is not available." };
  }
  const enrollment = await loadEnrollment(session.user.id, program.id);
  if (!enrollment) {
    return {
      ok: false as const,
      error: "Enroll for ₹3,500 + GST before sitting the exam.",
    };
  }

  const attempt = await loadOrCreateAttempt(
    session.user.organizationId,
    session.user.id,
  );
  const meta = parseMeta(attempt.aiMetadata);
  if (!isKycComplete(meta.kyc)) {
    return {
      ok: false as const,
      error: "Complete Aadhaar, PAN and resume before the exam.",
    };
  }

  const existingResponses = parseResponses(attempt.responses);
  if (isPersonalityExamComplete(existingResponses)) {
    return { ok: false as const, error: "This exam is already submitted." };
  }

  const paper = paperForExam(attempt.id, meta.examPaper);
  const questions = questionsForExam(paper);
  const normalized: Record<string, number> = {};

  for (const question of questions) {
    const displayed = answers[question.id];
    if (typeof displayed !== "number" || !Number.isInteger(displayed)) {
      return { ok: false as const, error: "Answer every question before submitting." };
    }
    const battery = batteryForQuestionId(question.id);
    const original =
      battery === "psyche"
        ? displayed
        : originalOptionIndex(paper, question.id, displayed);
    if (
      original === null ||
      original < 0 ||
      original >= question.options.length
    ) {
      return { ok: false as const, error: "One of the answers is out of range." };
    }
    normalized[question.id] = original;
  }

  const nextResponses = splitExamAnswers(normalized);
  if (!isPersonalityExamComplete(nextResponses)) {
    return { ok: false as const, error: "Answer every question before submitting." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { headline: true, careerPath: true, bio: true, name: true },
  });
  const resumeKeywords = [
    ...(meta.kyc.resumeKeywords ?? []),
    ...extractResumeKeywords(
      `${user?.headline ?? ""} ${user?.careerPath ?? ""} ${user?.bio ?? ""}`,
    ),
  ];
  const report = buildPersonalityReport(nextResponses, { resumeKeywords });
  const examSummary = [
    `Edith Personality Profile aptitude ${report.aptitude.band} ${report.aptitude.percent}%`,
    `quantitative ${report.quantitative.band} ${report.quantitative.percent}%`,
    `psyche ${report.psyche.top.join(" ")}`,
    ...report.insights,
  ].join(". ");

  await indexStudentGraph({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    name: user?.name ?? session.user.name,
    headline: user?.headline,
    bio: user?.bio,
    careerPath: user?.careerPath,
    resumeText: meta.kyc.resumeText,
    examSummary,
  });

  let ragGuidance: string[] = [];
  try {
    const retrieved = await retrieveForStudent({
      organizationId: session.user.organizationId,
      userId: session.user.id,
      query:
        "Foundrys programme guidance from resume skills and Edith Personality Profile aptitude quantitative psyche scores",
      limit: 8,
    });
    ragGuidance = groundedStudentGuidance({
      aptitudeBand: report.aptitude.band,
      quantitativeBand: report.quantitative.band,
      psycheTop: report.psyche.top[0] ?? "drive",
      keywords: resumeKeywords,
      retrieved,
      recommendations: report.recommendations,
    });
  } catch {
    ragGuidance = report.insights.slice(0, 3);
  }

  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      responses: jsonWithoutNul(nextResponses) as Prisma.InputJsonValue,
      status: "COMPLETED",
      completedAt: new Date(),
      aiMetadata: jsonWithoutNul({
        ...meta,
        examPaper: paper,
      }) as Prisma.InputJsonValue,
      domainScores: jsonWithoutNul({
        aptitude: report.aptitude,
        quantitative: report.quantitative,
        psyche: report.psyche,
      }) as Prisma.InputJsonValue,
      personalizedInsights: jsonWithoutNul({
        insights: report.insights,
        recommendations: report.recommendations,
        ragGuidance,
      }) as Prisma.InputJsonValue,
      results: jsonWithoutNul(report) as Prisma.InputJsonValue,
    },
  });

  try {
    const existingCert = await prisma.certificate.findUnique({
      where: {
        programId_userId: {
          programId: program.id,
          userId: session.user.id,
        },
      },
    });
    if (!existingCert) {
      const code = `EPP-${session.user.id.slice(0, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      await prisma.certificate.create({
        data: {
          organizationId: session.user.organizationId,
          programId: program.id,
          userId: session.user.id,
          title: "Edith Personality Profile",
          certificateId: code,
        },
      });
    }
  } catch {
    // Certificate is brand extra; exam result still stands.
  }

  revalidatePersonality();

  return {
    ok: true as const,
    finished: true as const,
    nextHref: `${PERSONALITY_PROFILE_HREF}/report`,
  };
}

export async function submitPersonalitySection(
  _section: string,
  answers: Record<string, number>,
) {
  return submitPersonalityExam(answers);
}

export async function getPersonalityTrainerRoster() {
  const session = await requireCapability("manageApplications");
  const board = await loadPersonalityLeaderboard(session.user.organizationId);
  const attempts = await prisma.cliftonAssessment.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      userId: true,
      status: true,
      aiMetadata: true,
      user: { select: { name: true, email: true } },
    },
  });
  const byUser = new Map(attempts.map((attempt) => [attempt.userId, attempt]));
  const rankedIds = new Set(board.map((row) => row.userId));
  const pending = attempts
    .filter((attempt) => !rankedIds.has(attempt.userId))
    .map((attempt) => {
      const meta = parseMeta(attempt.aiMetadata);
      return {
        userId: attempt.userId,
        name: attempt.user.name,
        email: attempt.user.email,
        status: attempt.status,
        keywords: meta.kyc?.resumeKeywords ?? [],
        rank: null as number | null,
        percentile: null as number | null,
        aptitudeBand: null as string | null,
        quantitativeBand: null as string | null,
        psycheLabel: null as string | null,
        composite: null as number | null,
      };
    });

  const ranked = board.map((row) => {
    const attempt = byUser.get(row.userId);
    const meta = parseMeta(attempt?.aiMetadata);
    return {
      userId: row.userId,
      name: row.name,
      email: attempt?.user.email ?? "",
      status: "COMPLETED",
      keywords: meta.kyc?.resumeKeywords ?? [],
      rank: row.rank,
      percentile: row.percentile,
      aptitudeBand: String(row.aptitudeBand),
      quantitativeBand: String(row.quantitativeBand),
      psycheLabel: row.psycheLabel,
      composite: row.composite,
    };
  });

  return { ok: true as const, rows: [...ranked, ...pending] };
}

export async function getPersonalityTrainerDetail(userId: string) {
  const session = await requireCapability("manageApplications");
  const attempt = await prisma.cliftonAssessment.findFirst({
    where: { organizationId: session.user.organizationId, userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, headline: true } } },
  });
  if (!attempt) {
    return { ok: false as const, error: "No assessment for this student." };
  }
  const meta = parseMeta(attempt.aiMetadata);
  const board = await loadPersonalityLeaderboard(session.user.organizationId);
  const rank = board.find((row) => row.userId === userId) ?? null;
  const responses = parseResponses(attempt.responses);
  const report = isPersonalityExamComplete(responses)
    ? buildPersonalityReport(responses, {
        resumeKeywords: meta.kyc?.resumeKeywords,
      })
    : null;
  let retrieved: Awaited<ReturnType<typeof retrieveForStudent>> = [];
  try {
    retrieved = await retrieveForStudent({
      organizationId: session.user.organizationId,
      userId,
      query: "trainer briefing strengths gaps recommended Foundrys programmes",
      limit: 8,
    });
  } catch {
    retrieved = [];
  }
  const brief = trainerBrief({
    name: attempt.user.name,
    keywords: meta.kyc?.resumeKeywords ?? [],
    aptitudeBand: rank?.aptitudeBand ? String(rank.aptitudeBand) : report?.aptitude.band,
    quantitativeBand: rank?.quantitativeBand
      ? String(rank.quantitativeBand)
      : report?.quantitative.band,
    psycheTop: rank?.psycheTop ?? report?.psyche.top[0],
    recommendations: report?.recommendations ?? resumeRecommendations(meta.kyc?.resumeKeywords ?? []),
    retrieved,
  });

  return {
    ok: true as const,
    student: {
      name: attempt.user.name,
      email: attempt.user.email,
      headline: attempt.user.headline,
    },
    kyc:
      isKycComplete(meta.kyc) || isAadhaarVerified(meta.kyc)
        ? {
            resumeFileName: meta.kyc.resumeFileName,
            keywords: meta.kyc.resumeKeywords ?? [],
          }
        : null,
    rank: rank
      ? {
          place: rank.rank,
          total: board.length,
          percentile: rank.percentile,
          composite: rank.composite,
        }
      : null,
    report,
    brief,
  };
}
