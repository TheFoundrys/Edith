import { PrismaClient } from "@prisma/client";

const PRISMA_CLIENT_VERSION = "edith-express-v1";

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
  void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }
  return client;
}

export const prisma = getPrisma();
