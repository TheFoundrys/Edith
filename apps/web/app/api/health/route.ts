import { NextResponse } from "next/server";
import { databaseTargetFromEnv } from "@/lib/db/datasource";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const target = databaseTargetFromEnv();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      database: "ok",
      dbHost: target?.host ?? null,
      dbName: target?.database ?? null,
      dbSchema: target?.schema ?? null,
      uptime: process.uptime(),
      latencyMs: Date.now() - startedAt,
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        database: "unavailable",
        dbHost: target?.host ?? null,
        dbName: target?.database ?? null,
        uptime: process.uptime(),
      },
      { status: 503 },
    );
  }
}
