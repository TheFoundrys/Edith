import "server-only";

import { APP_NAME } from "@/lib/brand";

type InviteDelivery =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

export async function sendMembershipInviteEmail(input: {
  email: string;
  inviteUrl: string;
  organizationName: string;
  roleLabel: string;
}): Promise<InviteDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.error("[membership-invite] email delivery is not configured");
    return { ok: false, reason: "not_configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        subject: `Join ${input.organizationName} on ${APP_NAME}`,
        text: `You have been invited to join ${input.organizationName} as ${input.roleLabel}. This link expires in 7 days:\n\n${input.inviteUrl}\n\nIf you did not expect this invitation, you can ignore this email.`,
        html: `<p>You have been invited to join <strong>${input.organizationName}</strong> as ${input.roleLabel}.</p><p><a href="${input.inviteUrl}">Accept invitation</a></p><p>This link expires in 7 days. If you did not expect this invitation, you can ignore this email.</p>`,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[membership-invite] email provider rejected delivery", {
        status: response.status,
      });
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true };
  } catch {
    console.error("[membership-invite] email delivery failed");
    return { ok: false, reason: "delivery_failed" };
  }
}

import { getSiteOrigin, publicAppOrigin } from "@/lib/urls";

export { publicAppOrigin, getSiteOrigin };
