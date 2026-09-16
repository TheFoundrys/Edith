import { createHmac, timingSafeEqual } from "crypto";
import type {
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  PaymentPort,
  VerifyPaymentInput,
} from "@/lib/payments/types";
import { absoluteUrl } from "@/lib/urls";

type StripeConfig = {
  secretKey: string;
  webhookSecret?: string;
};

function hmacEqual(expected: string, provided: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export class StripePaymentAdapter implements PaymentPort {
  readonly provider = "STRIPE" as const;

  constructor(private readonly config: StripeConfig) {}

  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    const currency = (input.currency || "INR").trim().toLowerCase();
    const amountMinor = Math.round(input.amount * 100);
    const successUrl = absoluteUrl(
      `/payment/success?receipt=${encodeURIComponent(input.receipt)}`,
    );
    const cancelUrl = absoluteUrl("/student/transactions");

    const body = new URLSearchParams({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(amountMinor),
      "line_items[0][price_data][product_data][name]": input.receipt.slice(0, 120),
      "metadata[receipt]": input.receipt,
      ...(input.notes
        ? Object.fromEntries(
            Object.entries(input.notes).map(([key, value]) => [
              `metadata[${key}]`,
              value,
            ]),
          )
        : {}),
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Stripe checkout failed (${res.status}): ${text}`);
    }

    const session = (await res.json()) as { id: string; url: string | null };
    return {
      providerOrderId: session.id,
      amount: input.amount,
      currency: input.currency,
      checkoutKey: null,
      checkout: {
        mode: "stripe_redirect",
        url: session.url ?? "",
        sessionId: session.id,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(input.providerOrderId)}`,
      {
        headers: { Authorization: `Bearer ${this.config.secretKey}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return false;
    const session = (await res.json()) as {
      payment_status?: string;
      payment_intent?: string | { id?: string };
    };
    if (session.payment_status !== "paid") return false;
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    return Boolean(intent && intent === input.providerPaymentId);
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    if (!this.config.webhookSecret) return false;
    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    const timestamp = parts.t;
    const provided = parts.v1;
    if (!timestamp || !provided) return false;
    const payload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", this.config.webhookSecret)
      .update(payload)
      .digest("hex");
    return hmacEqual(expected, provided);
  }
}
