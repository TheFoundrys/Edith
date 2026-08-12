import { PrismaClient } from "@prisma/client";

// Bump when models/fields change so a long-lived Next.js process
// does not keep a PrismaClient generated against an older schema.
const PRISMA_CLIENT_VERSION = "edith-postgres-v3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrisma() {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION
  ) {
    return globalForPrisma.prisma;
  }

  // Drop stale client after schema/enum changes (common in Next.js hot reload).
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }
  return client;
}

export const prisma = getPrisma();
