import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentAdapter, getPaymentConfig } from "@/lib/payments";
import {
  completeCoursePayment,
  completePaidPayment,
  markPaymentFailed,
} from "@/lib/payments/complete";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
        error_description?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const config = getPaymentConfig();

  if (config.adapter !== "razorpay") {
    return NextResponse.json({ error: "Razorpay not enabled" }, { status: 400 });
  }

  try {
    const adapter = getPaymentAdapter();
    if (!adapter.verifyWebhook?.(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const entity = body.payload?.payment?.entity;
    const orderId = entity?.order_id;
    const paymentId = entity?.id;
    if (!orderId || !paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: orderId },
    });
    if (!payment) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const event = body.event || "";
    if (event === "payment.captured" || entity?.status === "captured") {
      if (payment.purpose === "COURSE_FEE" || payment.enrollmentId) {
        await completeCoursePayment({
          paymentId: payment.id,
          providerPaymentId: paymentId,
          // Do not store webhook HMAC as the checkout payment signature.
          note: "Course fee paid (Razorpay webhook)",
        });
      } else {
        await completePaidPayment({
          paymentId: payment.id,
          providerPaymentId: paymentId,
          note: "Fee paid (Razorpay webhook)",
        });
      }
    } else if (event === "payment.failed" || entity?.status === "failed") {
      await markPaymentFailed({
        paymentId: payment.id,
        reason: entity?.error_description || "Payment failed",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payments/webhook]", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
