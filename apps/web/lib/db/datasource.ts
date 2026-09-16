/** Parse DATABASE_URL for logging / health checks (never log credentials). */
export function databaseTargetFromEnv(
  raw = process.env.DATABASE_URL?.trim(),
): { host: string; port: string; database: string; schema: string } | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      host: url.hostname,
      port: url.port || "5432",
      database: url.pathname.replace(/^\//, "") || "postgres",
      schema: url.searchParams.get("schema") || "public",
    };
  } catch {
    return null;
  }
}

/** Prisma datasource URL with sane timeouts for LAN / remote Postgres. */
export function prismaDatasourceUrl(
  raw = process.env.DATABASE_URL?.trim(),
): string | undefined {
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
