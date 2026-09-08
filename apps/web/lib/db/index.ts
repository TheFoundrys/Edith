import { PrismaClient } from "@prisma/client";

// Bump when models/fields change so a long-lived Next.js process
// does not keep a PrismaClient generated against an older schema.
const PRISMA_CLIENT_VERSION = "edith-postgres-v7";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: string;
};

/** True when the engine lost the server (LAN blip, sleep, closed connection). */
export function isPrismaUnreachable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code =
    "code" in error
      ? String((error as { code: unknown }).code)
      : "errorCode" in error
        ? String((error as { errorCode: unknown }).errorCode)
        : "";
  if (code === "P1001" || code === "P1002" || code === "P1017") return true;
  const message =
    "message" in error ? String((error as { message: unknown }).message) : "";
  return (
    message.includes("Can't reach database server") ||
    message.includes("Server has closed the connection")
  );
}

function datasourceUrl() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "8");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

let reconnecting = false;

function replay(
  client: PrismaClient,
  model: string | undefined,
  operation: string,
  args: unknown,
) {
  const target = client as unknown as Record<string, unknown>;
  if (model) {
    const key = model.charAt(0).toLowerCase() + model.slice(1);
    const delegate = target[key] as Record<string, (value: unknown) => unknown>;
    return delegate[operation]!(args);
  }
  return (target[operation] as (value: unknown) => unknown)(args);
}

async function recyclePrisma(): Promise<PrismaClient> {
  const previous = globalForPrisma.prisma;
  const client: PrismaClient = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  void previous?.$disconnect().catch(() => undefined);
  return client;
}

function createPrismaClient(): PrismaClient {
  const url = datasourceUrl();
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasourceUrl: url } : {}),
  });

  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (reconnecting || !isPrismaUnreachable(error)) throw error;
          reconnecting = true;
          try {
            const next: PrismaClient = await recyclePrisma();
            return await replay(next, model, operation, args);
          } finally {
            reconnecting = false;
          }
        }
      },
    },
  }) as unknown as PrismaClient;
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
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  return client;
}

/** Forwards to the current client so a recycle is visible to every import. */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (prop === "then") return undefined;
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
