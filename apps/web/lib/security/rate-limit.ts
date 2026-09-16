import "server-only";

import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";

function bucketKey(action: string, identifier: string) {
  const digest = createHash("sha256")
    .update(identifier.trim().toLowerCase())
    .digest("hex");
  return `${action}:${digest}`;
}

type BucketState = { count: number; resetAt: Date };

/** Per-process fallback when RateLimitBucket is unavailable (compass_dev). */
const memoryBuckets = new Map<string, BucketState>();

function consumeRateLimitMemory(input: {
  limit: number;
  windowMs: number;
  action: string;
  identifier: string;
}): { allowed: boolean; retryAfterSeconds: number } {
  const key = bucketKey(input.action, input.identifier);
  const now = new Date();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt.getTime() <= now.getTime()) {
    const resetAt = new Date(now.getTime() + input.windowMs);
    memoryBuckets.set(key, { count: 1, resetAt });
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

  existing.count += 1;
  memoryBuckets.set(key, existing);
  return { allowed: true, retryAfterSeconds };
}

function isMissingRateLimitTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" ||
      (error.code === "P2010" &&
        error.message.includes("RateLimitBucket")))
  );
}

export async function consumeRateLimit(input: {
  action: string;
  identifier: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (isCompassDatabase()) {
    return consumeRateLimitMemory(input);
  }

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
      if (isMissingRateLimitTable(error)) {
        return consumeRateLimitMemory(input);
      }
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
