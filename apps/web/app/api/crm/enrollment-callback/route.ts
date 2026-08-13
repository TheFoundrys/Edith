import { NextResponse } from "next/server";
import {
  activateEnrollmentFromCrm,
  rejectEnrollmentFromCrm,
} from "@/lib/crm/enrollment-callback";
import { prisma } from "@/lib/db";

/**
 * Inbound CentraCRM callback to approve/reject course enrollments that
 * require CRM confirmation (program.requiresCrmCallback).
 *
 * Auth: Authorization: Bearer $CRM_WEBHOOK_SECRET
 *       or x-crm-webhook-secret: $CRM_WEBHOOK_SECRET
 *
 * Body JSON:
 * {
 *   "enrollmentId": "...",          // required (EDITH enrollment id)
 *   "status": "APPROVED" | "REJECTED",
 *   "leadId": "...",                // optional CRM lead id
 *   "note": "..."                   // optional
 * }
 */
export async function POST(req: Request) {
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
  if (bearer !== secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    enrollmentId?: string;
    status?: string;
    leadId?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const enrollmentId = body.enrollmentId?.trim();
  const status = (body.status ?? "").trim().toUpperCase();
  if (!enrollmentId) {
    return NextResponse.json(
      { error: "enrollmentId is required." },
      { status: 400 },
    );
  }
  if (status !== "APPROVED" && status !== "REJECTED") {
    return NextResponse.json(
      { error: 'status must be "APPROVED" or "REJECTED".' },
      { status: 400 },
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { program: { select: { requiresCrmCallback: true, title: true } } },
  });
  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
  }
  if (!enrollment.program.requiresCrmCallback) {
    return NextResponse.json(
      { error: "This course does not require a CRM callback." },
      { status: 400 },
    );
  }

  if (status === "APPROVED") {
    const result = await activateEnrollmentFromCrm({
      enrollmentId,
      leadId: body.leadId,
      note: body.note,
    });
    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      status: "ACTIVE",
      enrollmentId: result.enrollmentId,
      programId: result.programId,
      alreadyActive: result.alreadyActive,
    });
  }

  const result = await rejectEnrollmentFromCrm({
    enrollmentId,
    leadId: body.leadId,
    note: body.note,
  });
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    status: "CANCELLED",
    enrollmentId,
    alreadyCancelled: result.alreadyCancelled,
  });
}
