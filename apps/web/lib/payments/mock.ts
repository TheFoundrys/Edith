import type {
  CreatePaymentOrderInput,
  CreatePaymentOrderResult,
  PaymentPort,
  VerifyPaymentInput,
} from "@/lib/payments/types";

/** Local/dev adapter — no external gateway. Client "Pay now" completes instantly. */
export class MockPaymentAdapter implements PaymentPort {
  readonly provider = "MOCK" as const;

  async createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult> {
    const providerOrderId = `mock_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      providerOrderId,
      amount: input.amount,
      currency: input.currency,
      checkoutKey: null,
      checkout: {
        mode: "mock",
        receipt: input.receipt,
      },
    };
  }

  async verifyPayment(_input: VerifyPaymentInput): Promise<boolean> {
    return true;
  }
}
