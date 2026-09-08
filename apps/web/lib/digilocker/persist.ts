import { Prisma } from "@prisma/client";
import { jsonWithoutNul } from "@/lib/db/pg-json";
import {
  recordDigilockerAadhaar,
  type PersonalityKyc,
} from "@/lib/assessments/personality-kyc";
import {
  isPersonalityProfileProgram,
  PERSONALITY_PROFILE_SLUG,
} from "@/lib/assessments/personality-profile";
import { prisma } from "@/lib/db";

export async function loadPersonalityProgram(organizationId: string) {
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
  if (!program || !isPersonalityProfileProgram(program)) {
    return { error: "Personality Profile is not available." as const };
  }
  return { program };
}

export async function loadPersonalityEnrollment(
  userId: string,
  organizationId: string,
) {
  const access = await loadPersonalityProgram(organizationId);
  if ("error" in access) return access;

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId, programId: access.program.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!enrollment) {
    return { error: "You need an active enrollment to sit the exam." as const };
  }
  return { program: access.program, enrollment };
}

export async function persistAadhaarRecord(input: {
  userId: string;
  organizationId: string;
  recorded: Pick<
    PersonalityKyc,
    | "aadhaarLast4"
    | "aadhaarMask"
    | "aadhaarHash"
    | "aadhaarSource"
    | "aadhaarName"
    | "aadhaarVerifiedAt"
  >;
}) {
  const access = await loadPersonalityProgram(input.organizationId);
  if ("error" in access) return { error: access.error };

  const existing = await prisma.cliftonAssessment.findFirst({
    where: { organizationId: input.organizationId, userId: input.userId },
    orderBy: { createdAt: "desc" },
  });
  const attempt =
    existing ??
    (await prisma.cliftonAssessment.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        status: "PENDING",
        responses: {},
        aiMetadata: {},
      },
    }));

  const rawMeta =
    attempt.aiMetadata &&
    typeof attempt.aiMetadata === "object" &&
    !Array.isArray(attempt.aiMetadata)
      ? (attempt.aiMetadata as { kyc?: unknown; papers?: unknown; examPaper?: unknown })
      : {};
  const previous =
    rawMeta.kyc && typeof rawMeta.kyc === "object" && !Array.isArray(rawMeta.kyc)
      ? (rawMeta.kyc as PersonalityKyc)
      : {};

  const kyc: PersonalityKyc = {
    ...previous,
    ...input.recorded,
  };

  await prisma.cliftonAssessment.update({
    where: { id: attempt.id },
    data: {
      status: attempt.status === "PENDING" ? "IN_PROGRESS" : attempt.status,
      aiMetadata: jsonWithoutNul({ ...rawMeta, kyc }) as Prisma.InputJsonValue,
    },
  });

  return { ok: true as const, mask: input.recorded.aadhaarMask };
}

export async function persistDigilockerAadhaar(input: {
  userId: string;
  organizationId: string;
  uidDigits: string;
  last4: string;
  name: string;
}) {
  const recorded = recordDigilockerAadhaar({
    uidDigits: input.uidDigits,
    last4: input.last4,
    name: input.name,
  });
  if ("error" in recorded) return { error: recorded.error };
  return persistAadhaarRecord({
    userId: input.userId,
    organizationId: input.organizationId,
    recorded,
  });
}
