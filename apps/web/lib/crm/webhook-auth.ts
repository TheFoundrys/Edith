import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function secretsMatch(candidate: string, expected: string) {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

/** Returns null when authorized; otherwise a 401/503 NextResponse. */
export function verifyCrmWebhookRequest(req: Request): NextResponse | null {
  const secret = process.env.CRM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRM webhook is not configured." },
      { status: 503 },
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const headerSecret = req.headers.get("x-crm-webhook-secret")?.trim() ?? "";
  if (
    !secretsMatch(bearer, secret) &&
    !secretsMatch(headerSecret, secret)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
