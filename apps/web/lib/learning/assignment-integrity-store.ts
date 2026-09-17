import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  buildIntegrityReports,
  type IntegritySubmissionInput,
} from "@/lib/learning/assignment-integrity";

export async function refreshAssignmentIntegrity(assignmentId: string) {
  if (isCompassDatabase() || !assignmentId) return;
  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignmentId,
      status: { in: ["SUBMITTED", "GRADED"] },
    },
    select: {
      id: true,
      userId: true,
      contentBody: true,
      user: { select: { name: true } },
    },
  });
  const inputs: IntegritySubmissionInput[] = submissions.map((submission) => ({
    id: submission.id,
    userId: submission.userId,
    userName: submission.user.name || "Student",
    contentBody: submission.contentBody,
  }));
  const reports = buildIntegrityReports(inputs);
  if (inputs.length === 0) return;
  await prisma.$transaction(
    inputs.map((submission) =>
      prisma.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          integrityReport: (reports.get(submission.id) ??
            null) as Prisma.InputJsonValue,
        },
      }),
    ),
  );
}

export async function refreshAssignmentIntegritySafe(assignmentId: string) {
  try {
    await refreshAssignmentIntegrity(assignmentId);
  } catch (error) {
    console.error("assignment integrity scan failed", error);
  }
}
