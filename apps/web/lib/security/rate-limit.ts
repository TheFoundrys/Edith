import "server-only";

import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function bucketKey(action: string, identifier: string) {
  const digest = createHash("sha256")
    .update(identifier.trim().toLowerCase())
    .digest("hex");
  return `${action}:${digest}`;
}

export async function consumeRateLimit(input: {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const key = bucketKey(input.action, input.identifier);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const now = new Date();
          const existing = await tx.rateLimitBucket.findUnique({
            where: { key },
          });
          if (!existing || existing.resetAt.getTime() <= now.getTime()) {
            const resetAt = new Date(now.getTime() + input.windowMs);
            await tx.rateLimitBucket.upsert({
              where: { key },
              create: { key, count: 1, resetAt },
              update: { count: 1, resetAt },
            });
            return {
              allowed: true,
              retryAfterSeconds: Math.ceil(input.windowMs / 1000),
            };
          }
          const retryAfterSeconds = Math.max(
            1,
            Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
          );
          if (existing.count >= input.limit) {
            return { allowed: false, retryAfterSeconds };
          }
          await tx.rateLimitBucket.update({
            where: { key },
            data: { count: { increment: 1 } },
          });
          return { allowed: true, retryAfterSeconds };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }

  return { allowed: false, retryAfterSeconds: 60 };
}
