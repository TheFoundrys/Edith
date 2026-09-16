import { databaseTargetFromEnv } from "@/lib/db/datasource";

/** Read DATABASE_URL at call time (avoid bundler inlining). */
function databaseUrlFromEnv(): string | undefined {
  return process.env["DATABASE_URL"]?.trim();
}

/** True when DATABASE_URL targets the legacy Compass schema (Course, Domain, …). */
export function isCompassDatabase(url?: string): boolean {
  if (process.env["DB_PROFILE"] === "compass") return true;
  if (process.env["DB_PROFILE"] === "edith") return false;

  const resolved = url ?? databaseUrlFromEnv();
  if (resolved) {
    try {
      const db = new URL(resolved).pathname.replace(/^\//, "").toLowerCase();
      if (db === "compass_dev") return true;
      if (db === "edith_dev") return false;
    } catch {
      if (resolved.includes("/compass_dev")) return true;
      if (resolved.includes("/edith_dev")) return false;
    }
  }

  return databaseTargetFromEnv()?.database?.toLowerCase() === "compass_dev";
}

/** Prisma P2021 — table missing (common when Edith models run on compass_dev). */
export function isMissingPrismaTable(error: unknown, modelOrTable?: string) {
  if (!error || typeof error !== "object") return false;
  if ((error as { code?: string }).code !== "P2021") return false;
  if (!modelOrTable) return true;
  const meta = (error as { meta?: { table?: string; modelName?: string } }).meta;
  const token = modelOrTable.toLowerCase();
  return (
    meta?.modelName?.toLowerCase() === token ||
    Boolean(meta?.table?.toLowerCase().includes(token))
  );
}
