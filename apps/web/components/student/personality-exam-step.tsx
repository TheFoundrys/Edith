import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { CourseCheckoutPanel } from "@/components/student/course-checkout-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PERSONALITY_EXAM_HREF,
  PERSONALITY_PROFILE_HREF,
  PERSONALITY_PROFILE_RANK_HREF,
} from "@/lib/assessments/personality-profile";
import { formatCurrency } from "@/lib/utils";
import type { CheckoutQuoteView } from "@/components/student/course-checkout-panel";

type Battery = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  questionCount: number;
};

type Quote = CheckoutQuoteView;

type PaymentAvailability = {
  available: boolean;
  mode: "razorpay" | "mock" | null;
  message: string | null;
};

export function PersonalityExamStep({
  examUnlocked,
  recommendedExam,
  batteries,
  progress,
  rank,
  courseSlug,
  quote,
  payment,
}: {
  examUnlocked: boolean;
  recommendedExam: { title: string; fee: string; reason: string };
  batteries: Battery[];
  progress: { done: number; total: number; pct: number };
  rank: {
    place: number;
    total: number;
    percentile: number;
    composite: number;
  } | null;
  courseSlug: string;
  quote: Quote | null;
  payment: PaymentAvailability;
}) {
  return (
    <div className="personality-exam-step">
      <p className="mt-1 text-sm text-fg-muted leading-relaxed">
        {examUnlocked
          ? recommendedExam.reason
          : "Pay the assessment fee to open the 90-question sitting. Your rank and battery scores appear on your profile after submission."}
      </p>

      <ul className="personality-battery-grid mt-5">
        {batteries.map((battery) => (
          <li key={battery.id} className="personality-battery-card">
            <p className="personality-battery-title">{battery.title}</p>
            <p className="personality-battery-meta">
              {battery.questionCount} questions · ~{battery.minutes} min
            </p>
            <p className="personality-battery-summary">{battery.summary}</p>
          </li>
        ))}
      </ul>

      {examUnlocked ? (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-fg-muted">
                {progress.done} of {progress.total} questions complete
              </p>
              {rank ? (
                <p className="mt-1 text-sm">
                  Rank #{rank.place} of {rank.total} · {rank.percentile}th
                  percentile · composite {rank.composite}
                </p>
              ) : null}
            </div>
            <Badge tone={progress.pct === 100 ? "success" : "neutral"}>
              {progress.pct}%
            </Badge>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {progress.pct === 100 ? (
              <>
                <Link href={`${PERSONALITY_PROFILE_HREF}/report`}>
                  <Button size="sm">View scores on profile</Button>
                </Link>
                <Link href={PERSONALITY_PROFILE_RANK_HREF}>
                  <Button size="sm" variant="secondary">
                    Public board
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={PERSONALITY_EXAM_HREF}>
                <Button size="sm">Continue exam</Button>
              </Link>
            )}
          </div>
        </>
      ) : (
        <div className="personality-pay-lock mt-5">
          <div className="personality-pay-lock-head">
            <span className="personality-pay-lock-icon" aria-hidden>
              <Lock className="size-4" strokeWidth={2.25} />
            </span>
            <div>
              <p className="font-medium">Exam locked until payment</p>
              <p className="mt-1 text-sm text-fg-muted">
                Secure checkout via Razorpay. The sitting opens immediately after
                payment is verified.
              </p>
            </div>
          </div>

          {quote && payment.available ? (
            <div className="mt-4">
              {payment.mode === "mock" && payment.message ? (
                <p className="mb-3 text-xs text-fg-muted">{payment.message}</p>
              ) : null}
              <CourseCheckoutPanel
                courseSlug={courseSlug}
                amount={quote.totalAmount}
                currency={quote.currency}
                initialQuote={quote}
                successHref={`${PERSONALITY_PROFILE_HREF}?paid=1#personality-step-3`}
                payLabel="Pay now"
                description="One-time fee for the 90-question Edith Personality Profile sitting."
              />
              {payment.mode === "razorpay" ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-fg-muted">
                  <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                  Payments are processed securely by Razorpay.
                </p>
              ) : null}
            </div>
          ) : quote ? (
            <p className="mt-4 font-display text-2xl">
              {formatCurrency(quote.totalAmount, quote.currency)}
            </p>
          ) : (
            <p className="mt-4 font-display text-2xl">{recommendedExam.fee}</p>
          )}

          {!payment.available ? (
            <div className="mt-5 rounded-[var(--radius)] border border-dashed border-border bg-bg p-4">
              <p className="text-sm font-medium">Payment unavailable</p>
              <p className="mt-1 text-sm text-fg-muted">
                {payment.message ??
                  "Online payment is not available right now. Contact your campus admin."}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
