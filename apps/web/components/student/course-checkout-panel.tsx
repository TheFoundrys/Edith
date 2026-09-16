"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  completeMockCoursePayment,
  startCheckout,
  verifyCoursePayment,
} from "@/lib/actions/enrollments";
import { previewCourseQuote } from "@/lib/actions/pricing";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { APP_NAME } from "@/lib/brand";
import { formatCurrency } from "@/lib/utils";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type CheckoutQuoteView = {
  currency: string;
  listPrice: number;
  principalAmount: number;
  discountAmount: number;
  gstAmount: number;
  convenienceFee: number;
  totalAmount: number;
  couponCode: string | null;
  offerId: string | null;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function waitForRazorpay(timeoutMs = 10000) {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (window.Razorpay) return true;
  }
  return false;
}

function QuoteBreakdown({ quote }: { quote: CheckoutQuoteView }) {
  const hasOffer =
    Boolean(quote.offerId) && quote.principalAmount !== quote.listPrice;
  return (
    <dl className="space-y-1.5 text-sm">
      {hasOffer ? (
        <>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Catalog price</dt>
            <dd className="text-fg-muted line-through">
              {formatCurrency(quote.listPrice, quote.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-fg-muted">Your offer</dt>
            <dd>{formatCurrency(quote.principalAmount, quote.currency)}</dd>
          </div>
        </>
      ) : (
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Course fee</dt>
          <dd>{formatCurrency(quote.principalAmount, quote.currency)}</dd>
        </div>
      )}
      {quote.discountAmount > 0 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">
            Coupon{quote.couponCode ? ` (${quote.couponCode})` : ""}
          </dt>
          <dd>−{formatCurrency(quote.discountAmount, quote.currency)}</dd>
        </div>
      ) : null}
      {quote.gstAmount > 0 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">GST</dt>
          <dd>{formatCurrency(quote.gstAmount, quote.currency)}</dd>
        </div>
      ) : null}
      {quote.convenienceFee > 0 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-fg-muted">Convenience fee</dt>
          <dd>{formatCurrency(quote.convenienceFee, quote.currency)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4 border-t border-border pt-2 font-medium">
        <dt>Amount due</dt>
        <dd>{formatCurrency(quote.totalAmount, quote.currency)}</dd>
      </div>
    </dl>
  );
}

export function CourseCheckoutPanel({
  courseSlug,
  intakeId,
  amount,
  currency,
  successHref,
  payLabel = "Pay and enroll",
  description,
  initialQuote,
}: {
  courseSlug: string;
  intakeId?: string;
  amount: number;
  currency: string;
  /** When set, skip the generic payment success page (e.g. personality profile step 3). */
  successHref?: string;
  payLabel?: string;
  description?: string;
  initialQuote?: CheckoutQuoteView;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewing, startPreview] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [couponCode, setCouponCode] = useState(initialQuote?.couponCode ?? "");
  const [quote, setQuote] = useState<CheckoutQuoteView>(
    initialQuote ?? {
      currency,
      listPrice: amount,
      principalAmount: amount,
      discountAmount: 0,
      gstAmount: 0,
      convenienceFee: 0,
      totalAmount: amount,
      couponCode: null,
      offerId: null,
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setScriptReady(true);
    }
  }, []);

  function finishCheckout(href: string) {
    router.push(href);
    router.refresh();
  }

  function applyCoupon() {
    setError(null);
    startPreview(async () => {
      const result = await previewCourseQuote(courseSlug, couponCode);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setQuote(result);
      setCouponCode(result.couponCode ?? couponCode.trim().toUpperCase());
    });
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      try {
        const order = await startCheckout(courseSlug, couponCode, intakeId);
        if ("error" in order && order.error) {
          setError(order.error);
          return;
        }
        if (!("ok" in order) || !order.ok) {
          setError("Could not start checkout.");
          return;
        }

        if ("awaitingCrm" in order && order.awaitingCrm) {
          finishCheckout(
            `/payment/success?course=${encodeURIComponent(order.programId!)}&enrollment=${encodeURIComponent(order.enrollmentId!)}&pending=crm`,
          );
          return;
        }

        if (order.alreadyEnrolled) {
          finishCheckout(
            successHref ??
              `/payment/success?course=${encodeURIComponent(order.programId)}&enrollment=${encodeURIComponent(order.enrollmentId)}`,
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
          finishCheckout(
            successHref ??
              `/payment/success?course=${encodeURIComponent(result.programId!)}&enrollment=${encodeURIComponent(result.enrollmentId!)}${pendingCrm}`,
          );
          return;
        }

        const checkoutMeta = order.checkout as { mode?: string; url?: string };
        if (order.provider === "STRIPE" && checkoutMeta.mode === "stripe_redirect") {
          if (!checkoutMeta.url) {
            setError("Stripe checkout URL is missing.");
            return;
          }
          window.location.href = checkoutMeta.url;
          return;
        }

        if (!order.providerOrderId) {
          setError("Payment order is incomplete.");
          return;
        }

        const razorpayReady =
          scriptReady || (await waitForRazorpay());
        if (!razorpayReady || !window.Razorpay || !order.checkoutKey) {
          setError(
            "Razorpay checkout could not load. Check your connection and try again.",
          );
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
              return;
            }
            const pendingCrm = verified.awaitingCrm ? "&pending=crm" : "";
            finishCheckout(
              successHref ??
                `/payment/success?course=${encodeURIComponent(verified.programId!)}&enrollment=${encodeURIComponent(verified.enrollmentId!)}${pendingCrm}`,
            );
          },
          modal: {
            ondismiss: () => setError(null),
          },
        });
        rzp.open();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not start checkout.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onReady={() => setScriptReady(true)}
      />
      {description ? (
        <p className="text-sm text-fg-muted">{description}</p>
      ) : null}
      <QuoteBreakdown quote={quote} />
      <div>
        <Label htmlFor="courseCoupon">Coupon code</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="courseCoupon"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Optional"
            autoComplete="off"
            className="sm:max-w-xs uppercase"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={previewing}
            onClick={applyCoupon}
          >
            {previewing ? "Checking…" : "Apply"}
          </Button>
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          {quote.offerId
            ? "A personalised offer is already applied. A valid coupon stacks on that price."
            : "A valid coupon updates the amount due before you pay."}
        </p>
      </div>
      <Button
        type="button"
        onClick={pay}
        loading={pending}
        className="w-full sm:w-auto"
      >
        {pending ? "Processing…" : payLabel}
      </Button>
      <FieldError>{error}</FieldError>
    </div>
  );
}
