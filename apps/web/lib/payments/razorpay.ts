import { createHmac, timingSafeEqual } from "crypto";
import type {
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  PaymentPort,
  VerifyPaymentInput,
} from "@/lib/payments/types";

type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
};

function hmacEqual(expectedHex: string, provided: string) {
  const a = Buffer.from(expectedHex);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export class RazorpayPaymentAdapter implements PaymentPort {
  readonly provider = "RAZORPAY" as const;

  constructor(private readonly config: RazorpayConfig) {}

  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    // Razorpay expects amount in the smallest currency unit (paise for INR).
    const amountMinor = Math.round(input.amount * 100);
    const currency = (input.currency || "INR").trim().toUpperCase() || "INR";
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${this.config.keyId}:${this.config.keySecret}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountMinor,
        currency,
        receipt: input.receipt.slice(0, 40),
        notes: input.notes ?? {},
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Razorpay order failed (${res.status}): ${text}`);
    }

    const order = (await res.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    return {
      providerOrderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      checkoutKey: this.config.keyId,
      checkout: {
        mode: "razorpay",
        orderId: order.id,
      },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<boolean> {
    const payload = `${input.providerOrderId}|${input.providerPaymentId}`;
    const expected = createHmac("sha256", this.config.keySecret)
      .update(payload)
      .digest("hex");
    return hmacEqual(expected, input.providerSignature);
  }

  verifyWebhook(rawBody: string, signature: string): boolean {
    if (!this.config.webhookSecret) return false;
    const expected = createHmac("sha256", this.config.webhookSecret)
      .update(rawBody)
      .digest("hex");
    return hmacEqual(expected, signature);
  }
}
