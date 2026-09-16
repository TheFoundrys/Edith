import { NextResponse } from "next/server";
import {
  activateAdmissionFromCrm,
  rejectAdmissionFromCrm,
} from "@/lib/crm/admission-callback";
import { parseAdmissionCallbackStatus } from "@/lib/crm/admission-status";
import { verifyCrmWebhookRequest } from "@/lib/crm/webhook-auth";

/**
 * Inbound CentraCRM callback when a degree/admissions application is decided.
 * Creates or activates an Edith enrollment — CRM handles application; LMS handles learning.
 *
 * Auth: Authorization: Bearer $CRM_WEBHOOK_SECRET
 *       or x-crm-webhook-secret: $CRM_WEBHOOK_SECRET
 *
 * Body JSON:
 * {
 *   "email": "student@example.com",     // required — must match an Edith account
 *   "programSlug": "bsc-ai",            // required — published admissions programme
 *   "status": "ENROLLED" | "ADMITTED" | "APPROVED" | "REJECTED" | ...,
 *   "crmApplicationId": "...",          // optional
 *   "crmLeadId": "...",                 // optional
 *   "intakeId": "...",                  // optional Edith intake id
 *   "note": "..."                       // optional
 * }
 */
export async function POST(req: Request) {
  const authError = verifyCrmWebhookRequest(req);
  if (authError) return authError;

  let body: {
    email?: string;
    programSlug?: string;
    status?: string;
    crmApplicationId?: string;
    crmLeadId?: string;
    intakeId?: string;
    note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim();
  const programSlug = body.programSlug?.trim();
  const status = body.status?.trim() ?? "";
  if (!email) {
    return NextResponse.json({ error: "email is required." }, { status: 400 });
  }
  if (!programSlug) {
    return NextResponse.json(
      { error: "programSlug is required." },
      { status: 400 },
    );
  }

  const decision = parseAdmissionCallbackStatus(status);
  if (!decision) {
    return NextResponse.json(
      {
        error:
          'status must be an admission outcome such as "ENROLLED", "ADMITTED", "APPROVED", or "REJECTED".',
      },
      { status: 400 },
    );
  }

  if (decision === "ADMIT") {
    const result = await activateAdmissionFromCrm({
      email,
      programSlug,
      crmApplicationId: body.crmApplicationId,
      crmLeadId: body.crmLeadId,
      intakeId: body.intakeId,
      note: body.note,
    });
    if ("error" in result && result.error) {
      const statusCode = result.error.includes("not found") ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }
    return NextResponse.json({
      ok: true,
      status: "ACTIVE",
      enrollmentId: result.enrollmentId,
      programId: result.programId,
      userId: result.userId,
      alreadyActive: result.alreadyActive,
    });
  }

  const result = await rejectAdmissionFromCrm({
    email,
    programSlug,
    crmApplicationId: body.crmApplicationId,
    note: body.note,
  });
  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    status: "REJECTED",
    noop: result.noop,
  });
}
