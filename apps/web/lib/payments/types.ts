export type CreatePaymentOrderInput = {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type CreatePaymentOrderResult = {
  providerOrderId: string;
  amount: number;
  currency: string;
  /** Public key for client checkout (Razorpay key id); null for mock/offline */
  checkoutKey: string | null;
  /** Extra fields for the client checkout widget */
  checkout: Record<string, string>;
};

export type VerifyPaymentInput = {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
};

export interface PaymentPort {
  readonly provider: "MOCK" | "RAZORPAY";
  createOrder(input: CreatePaymentOrderInput): Promise<CreatePaymentOrderResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<boolean>;
  verifyWebhook?(rawBody: string, signature: string): boolean;
}
