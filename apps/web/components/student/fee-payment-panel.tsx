"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeMockApplicationFee,
  createApplicationFeeOrder,
  verifyApplicationFeePayment,
} from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { APP_NAME } from "@/lib/brand";
import { formatCurrency } from "@/lib/utils";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function FeePaymentPanel({
  applicationId,
  amount,
  currency,
  alreadyPaid,
  paidAmount,
  paymentDate,
}: {
  applicationId: string;
  amount: number | null;
  currency: string;
  alreadyPaid: boolean;
  paidAmount?: number | null;
  paymentDate?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  if (alreadyPaid) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Application fee paid</p>
        <p className="text-sm text-fg-muted">
          {formatCurrency(paidAmount ?? amount, currency)}
          {paymentDate ? ` · ${new Date(paymentDate).toLocaleString()}` : ""}
        </p>
      </div>
    );
  }

  if (amount == null || amount <= 0) {
    return (
      <p className="text-sm text-fg-muted">
        No application fee is configured for this program. Contact admissions.
      </p>
    );
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      const order = await createApplicationFeeOrder(applicationId);
      if ("error" in order && order.error) {
        setError(order.error);
        return;
      }
      if (!("ok" in order) || !order.ok) {
        setError("Could not start payment.");
        return;
      }

      if (order.provider === "MOCK") {
        const result = await completeMockApplicationFee(order.paymentId);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.refresh();
        return;
      }

      if (!scriptReady || !window.Razorpay || !order.checkoutKey) {
        setError("Payment checkout is still loading. Try again in a moment.");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.checkoutKey,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: APP_NAME,
        description: `Application fee — ${order.programName}`,
        order_id: order.providerOrderId,
        prefill: {
          name: order.applicantName,
          email: order.applicantEmail,
        },
        handler: async (response: RazorpaySuccess) => {
          const verified = await verifyApplicationFeePayment({
            paymentId: order.paymentId,
            providerPaymentId: response.razorpay_payment_id,
            providerSignature: response.razorpay_signature,
          });
          if (verified.error) {
            setError(verified.error);
            return;
          }
          router.refresh();
        },
        modal: {
          ondismiss: () => setError(null),
        },
      });
      rzp.open();
    });
  }

  return (
    <div className="space-y-3">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <div>
        <p className="text-sm font-medium">Application fee due</p>
        <p className="text-2xl font-semibold tracking-tight mt-1">
          {formatCurrency(amount, currency)}
        </p>
        <p className="text-xs text-fg-muted mt-1">
          Pay to confirm your seat and complete enrollment.
        </p>
      </div>
      <FieldError>{error}</FieldError>
      <Button onClick={pay} loading={pending}>
        {pending ? "Starting…" : "Pay application fee"}
      </Button>
    </div>
  );
}
