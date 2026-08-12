"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  completeMockCoursePayment,
  failCoursePayment,
  startCheckout,
  verifyCoursePayment,
} from "@/lib/actions/enrollments";
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

export function CourseCheckoutPanel({
  courseSlug,
  amount,
  currency,
}: {
  courseSlug: string;
  amount: number;
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  function pay() {
    setError(null);
    startTransition(async () => {
      const order = await startCheckout(courseSlug);
      if ("error" in order && order.error) {
        setError(order.error);
        return;
      }
      if (!("ok" in order) || !order.ok) {
        setError("Could not start checkout.");
        return;
      }

      if ("awaitingCrm" in order && order.awaitingCrm) {
        router.push(
          `/payment/success?course=${encodeURIComponent(order.programId!)}&enrollment=${encodeURIComponent(order.enrollmentId!)}&pending=crm`,
        );
        return;
      }

      if (order.alreadyEnrolled) {
        router.push(
          `/payment/success?course=${encodeURIComponent(order.programId)}`,
        );
        return;
      }

      if (!("paymentId" in order) || !order.paymentId) {
        setError("Could not create payment.");
        return;
      }

      if (order.provider === "MOCK") {
        const result = await completeMockCoursePayment(order.paymentId);
        if (result.error) {
          setError(result.error);
          return;
        }
        const pendingCrm = result.awaitingCrm ? "&pending=crm" : "";
        router.push(
          `/payment/success?course=${encodeURIComponent(result.programId!)}&enrollment=${encodeURIComponent(result.enrollmentId!)}${pendingCrm}`,
        );
        return;
      }

      if (!order.providerOrderId) {
        setError("Payment order is incomplete.");
        return;
      }

      if (!scriptReady || !window.Razorpay || !order.checkoutKey) {
        setError("Payment checkout is still loading. Try again in a moment.");
        return;
      }

      const rzp = new window.Razorpay({
        key: order.checkoutKey,
        amount: Math.round(order.amount! * 100),
        currency: order.currency,
        name: APP_NAME,
        description: `Course enrollment — ${order.programName}`,
        order_id: order.providerOrderId,
        prefill: {
          name: order.studentName,
          email: order.studentEmail,
        },
        handler: async (response: RazorpaySuccess) => {
          const verified = await verifyCoursePayment({
            paymentId: order.paymentId!,
            providerPaymentId: response.razorpay_payment_id,
            providerSignature: response.razorpay_signature,
          });
          if (verified.error) {
            setError(verified.error);
            await failCoursePayment(order.paymentId!, verified.error);
            router.push(
              `/payment/failed?course=${encodeURIComponent(courseSlug)}`,
            );
            return;
          }
          const pendingCrm = verified.awaitingCrm ? "&pending=crm" : "";
          router.push(
            `/payment/success?course=${encodeURIComponent(verified.programId!)}&enrollment=${encodeURIComponent(verified.enrollmentId!)}${pendingCrm}`,
          );
        },
        modal: {
          // Leave payment PENDING so retry can reuse the open Razorpay order.
          ondismiss: () => setError(null),
        },
      });
      rzp.open();
    });
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />
      <p className="text-sm text-fg-muted">
        You will be charged{" "}
        <span className="font-medium text-fg">
          {formatCurrency(amount, currency)}
        </span>{" "}
        to enroll.
      </p>
      <Button onClick={pay} loading={pending} className="w-full sm:w-auto">
        {pending ? "Processing…" : "Pay and enroll"}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
