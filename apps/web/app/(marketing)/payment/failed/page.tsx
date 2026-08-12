import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course: slug } = await searchParams;

  return (
    <MarketingShell maxWidth="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
        Payment failed
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t complete your payment
      </h1>
      <p className="mt-3 text-sm text-fg-muted">
        No charge was completed. You can try again or return to the course page.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {slug ? (
          <Link href={`/checkout?course=${encodeURIComponent(slug)}`}>
            <Button>Retry checkout</Button>
          </Link>
        ) : (
          <Link href="/courses">
            <Button>Browse courses</Button>
          </Link>
        )}
        {slug ? (
          <Link href={`/courses/${slug}`}>
            <Button variant="secondary">Back to course</Button>
          </Link>
        ) : null}
      </div>
    </MarketingShell>
  );
}
