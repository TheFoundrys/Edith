"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { requireStudent } from "@/lib/auth/session";
import {
  LIKERT_OPTIONS,
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_SLUG,
  PERSONALITY_SECTIONS,
  SECTION_QUESTIONS,
  buildPersonalityReport,
  completedSectionIds,
  isPersonalityProfileProgram,
  personalityProgress,
  publicQuestionsForSection,
  sectionAnswersComplete,
  type PersonalityResponses,
  type PersonalitySectionId,
} from "@/lib/assessments/personality-profile";
import { prisma } from "@/lib/db";

function parseResponses(value: unknown): PersonalityResponses {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const pick = (key: PersonalitySectionId) => {
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

async function loadEnrolledProfile(userId: string, organizationId: string) {
  const program = await prisma.program.findFirst({
    where: {
      organizationId,
      slug: PERSONALITY_PROFILE_SLUG,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      sku: true,
      domainSlug: true,
    },
  });
  if (!program || !isPersonalityProfileProgram(program)) return null;

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, programId: program.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!enrollment) return null;

  return { program, enrollment };
}

async function loadOrCreateAttempt(
  organizationId: string,
  userId: string,
) {
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
    },
  });
}

export async function getPersonalityProfileWorkspace() {
  const session = await requireStudent();
  const access = await loadEnrolledProfile(
    session.user.id,
    session.user.organizationId,
  );
  if (!access) {
    return { ok: false as const, error: "You need an active enrollment to take this assessment." };
  }

  const attempt = await prisma.cliftonAssessment.findFirst({
    where: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
    },
    orderBy: { createdAt: "desc" },
  });
  const responses = parseResponses(attempt?.responses);
  const completed = completedSectionIds(responses);
  const progress = personalityProgress(responses);
  const report =
    attempt?.status === "COMPLETED" && progress.done === PERSONALITY_SECTIONS.length
      ? buildPersonalityReport(responses)
      : null;

  return {
    ok: true as const,
    programTitle: access.program.title,
    completed,
    progress,
    report,
    status: attempt?.status ?? "PENDING",
    sections: PERSONALITY_SECTIONS.map((section) => ({
      ...section,
      done: completed.includes(section.id),
      questionCount: SECTION_QUESTIONS[section.id].length,
    })),
  };
}

export async function getPersonalitySection(section: PersonalitySectionId) {
  const workspace = await getPersonalityProfileWorkspace();
  if (!workspace.ok) return workspace;
  return {
    ok: true as const,
    section,
    title: PERSONALITY_SECTIONS.find((item) => item.id === section)?.title ?? section,
    summary:
      PERSONALITY_SECTIONS.find((item) => item.id === section)?.summary ?? "",
    done: workspace.completed.includes(section),
    questions: publicQuestionsForSection(section),
  };
}

export async function submitPersonalitySection(
  section: PersonalitySectionId,
  answers: Record<string, number>,
) {
  const session = await requireStudent();
  const access = await loadEnrolledProfile(
    session.user.id,
    session.user.organizationId,
  );
  if (!access) {
    return { ok: false as const, error: "You need an active enrollment to take this assessment." };
  }

  if (!PERSONALITY_SECTIONS.some((item) => item.id === section)) {
    return { ok: false as const, error: "Unknown assessment section." };
  }

  const questions = SECTION_QUESTIONS[section];
  const normalized: Record<string, number> = {};
  for (const question of questions) {
    const value = answers[question.id];
    const maxIndex =
      "options" in question ? question.options.length : LIKERT_OPTIONS.length;
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return { ok: false as const, error: "Answer every question before submitting." };
    }
    if (value < 0 || value >= maxIndex) {
      return { ok: false as const, error: "One of the answers is out of range." };
    }
    normalized[question.id] = value;
  }

  if (!sectionAnswersComplete(section, normalized)) {
    return { ok: false as const, error: "Answer every question before submitting." };
  }

  const attempt = await loadOrCreateAttempt(
    session.user.organizationId,
    session.user.id,
  );
  const responses = parseResponses(attempt.responses);
  if (sectionAnswersComplete(section, responses[section])) {
    return { ok: false as const, error: "This section is already submitted." };
  }

  const nextResponses: PersonalityResponses = {
    ...responses,
    [section]: normalized,
  };
  const completed = completedSectionIds(nextResponses);
  const finished = completed.length === PERSONALITY_SECTIONS.length;
  const report = finished ? buildPersonalityReport(nextResponses) : null;

  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      responses: nextResponses as Prisma.InputJsonValue,
      status: finished ? "COMPLETED" : "IN_PROGRESS",
      completedAt: finished ? new Date() : null,
      domainScores: (report
        ? {
            aptitude: report.aptitude,
            quantitative: report.quantitative,
            psyche: report.psyche,
          }
        : {}) as Prisma.InputJsonValue,
      personalizedInsights: (report
        ? { insights: report.insights, recommendations: report.recommendations }
        : {}) as Prisma.InputJsonValue,
      results: (report ?? {}) as Prisma.InputJsonValue,
    },
  });

  revalidatePath(PERSONALITY_PROFILE_HREF);
  revalidatePath(`${PERSONALITY_PROFILE_HREF}/take/${section}`);
  revalidatePath(`${PERSONALITY_PROFILE_HREF}/report`);
  revalidatePath("/student/assessments");
  revalidatePath("/student/dashboard");
  revalidatePath("/student/my-courses");

  return {
    ok: true as const,
    finished,
    nextHref: finished
      ? `${PERSONALITY_PROFILE_HREF}/report`
      : PERSONALITY_PROFILE_HREF,
  };
}
