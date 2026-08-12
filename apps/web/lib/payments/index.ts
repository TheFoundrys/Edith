import { MockPaymentAdapter } from "@/lib/payments/mock";
import { RazorpayPaymentAdapter } from "@/lib/payments/razorpay";
import type { PaymentPort } from "@/lib/payments/types";

export type PaymentConfig = {
  adapter: "mock" | "razorpay";
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
};

/** Mock checkout is for local/dev only unless explicitly allowed. */
export function isMockPaymentsAllowed(): boolean {
  if (process.env.ALLOW_MOCK_PAYMENTS === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function getPaymentConfig(): PaymentConfig {
  const raw = (process.env.PAYMENT_ADAPTER || "").toLowerCase().trim();
  // Production defaults to razorpay (fail-closed). Local/dev defaults to mock.
  const adapter: PaymentConfig["adapter"] =
    raw === "razorpay"
      ? "razorpay"
      : raw === "mock"
        ? "mock"
        : process.env.NODE_ENV === "production"
          ? "razorpay"
          : "mock";

  return {
    adapter,
    keyId: process.env.RAZORPAY_KEY_ID || undefined,
    keySecret: process.env.RAZORPAY_KEY_SECRET || undefined,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || undefined,
  };
}

export function getPaymentAdapter(): PaymentPort {
  const config = getPaymentConfig();
  if (config.adapter === "razorpay") {
    if (!config.keyId || !config.keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required.");
    }
    return new RazorpayPaymentAdapter({
      keyId: config.keyId,
      keySecret: config.keySecret,
      webhookSecret: config.webhookSecret,
    });
  }

  if (!isMockPaymentsAllowed()) {
    throw new Error(
      "Mock payments are disabled in production. Set PAYMENT_ADAPTER=razorpay with keys, or ALLOW_MOCK_PAYMENTS=true only for an approved non-prod environment.",
    );
  }

  return new MockPaymentAdapter();
}
