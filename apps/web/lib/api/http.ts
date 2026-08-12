import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max?: number,
) {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (max != null && n > max) return max;
  return n;
}
