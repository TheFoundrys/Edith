import "server-only";

type PasswordResetDelivery =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "delivery_failed" };

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
}): Promise<PasswordResetDelivery> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    console.error("[password-reset] email delivery is not configured");
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
        subject: "Reset your Edith password",
        text: `Reset your Edith password using this secure link. It expires in one hour:\n\n${input.resetUrl}\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Reset your Edith password using the secure link below. It expires in one hour.</p><p><a href="${input.resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[password-reset] email provider rejected delivery", {
        status: response.status,
      });
      return { ok: false, reason: "delivery_failed" };
    }
    return { ok: true };
  } catch {
    console.error("[password-reset] email delivery failed");
    return { ok: false, reason: "delivery_failed" };
  }
}
