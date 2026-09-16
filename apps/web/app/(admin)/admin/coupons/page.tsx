import Link from "next/link";
import { CouponActiveToggle } from "@/components/admin/coupon-active-toggle";
import { CouponForm } from "@/components/admin/coupon-form";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireCapability } from "@/lib/auth/session";
import { redirectIfCompassAdminRoute } from "@/lib/compass/require-edith";
import { prisma } from "@/lib/db";
import {
  couponDiscountLabel,
  couponLifecycle,
  couponLifecycleLabel,
} from "@/lib/payments/discounts";

function defaultExpiryLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function lifecycleTone(status: ReturnType<typeof couponLifecycle>) {
  if (status === "LIVE") return "success" as const;
  if (status === "INACTIVE") return "neutral" as const;
  return "warning" as const;
}

export default async function AdminCouponsPage() {
  redirectIfCompassAdminRoute();
  const session = await requireCapability("managePricing");
  const orgId = session.user.organizationId;
  const [coupons, programs, settings] = await Promise.all([
    prisma.coupon.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: { programs: { select: { id: true, title: true } } },
    }),
    prisma.program.findMany({
      where: { organizationId: orgId, status: { not: "ARCHIVED" } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.paymentSettings.findUnique({
      where: { organizationId: orgId },
      select: { currency: true },
    }),
  ]);

  const currency = settings?.currency || "INR";
  const now = new Date();
  const live = coupons.filter(
    (coupon) => couponLifecycle(coupon, now) === "LIVE",
  ).length;

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Reusable codes students enter at checkout. A coupon discounts the current tuition — after any personalised offer."
        actions={
          <Link href="/admin/offers" className="text-sm text-fg-muted underline">
            Program offers
          </Link>
        }
      />

      <p className="mb-[var(--grid-pad)] text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
        Code → Discount → Checkout
      </p>

      <div className="peak-stats">
        <div className="peak-stat">
          <p className="peak-stat-label">Coupons</p>
          <p className="peak-stat-value">{coupons.length}</p>
        </div>
        <div className="peak-stat">
          <p className="peak-stat-label">Live</p>
          <p className="peak-stat-value">{live}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <Panel className="p-[var(--grid-pad)] h-fit">
          <h2 className="font-display text-lg text-fg">New coupon</h2>
          <p className="mt-1 mb-4 text-sm text-fg-muted">
            Anyone with the code can use it until it expires or hits the usage cap.
          </p>
          <CouponForm
            programs={programs}
            defaultExpiresAt={defaultExpiryLocal()}
          />
        </Panel>

        <div>
          {coupons.length === 0 ? (
            <EmptyState
              title="No coupons yet"
              description="Create a percent or fixed-amount code. Leave max uses at 0 for unlimited redemptions."
            />
          ) : (
            <div className="cm-grid">
              {coupons.map((coupon) => {
                const status = couponLifecycle(coupon, now);
                return (
                  <article key={coupon.id} className="peak-card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
                        {coupon.scope === "GLOBAL"
                          ? "All programs"
                          : "Selected programs"}
                      </p>
                      <Badge tone={lifecycleTone(status)}>
                        {couponLifecycleLabel(status)}
                      </Badge>
                    </div>
                    <h2 className="mt-[var(--grid-gap)] font-display text-xl leading-snug text-fg font-mono tracking-tight">
                      {coupon.code}
                    </h2>
                    <p className="mt-1 text-sm text-fg">
                      {couponDiscountLabel(coupon, currency)}
                    </p>
                    {coupon.description ? (
                      <p className="mt-1 text-sm text-fg-muted">
                        {coupon.description}
                      </p>
                    ) : null}
                    {coupon.scope === "SPECIFIC" ? (
                      <p className="mt-2 text-xs text-fg-muted">
                        {coupon.programs.map((program) => program.title).join(" · ") ||
                          "No programs linked"}
                      </p>
                    ) : null}

                    <dl className="mt-[var(--grid-pad)] space-y-1.5 text-[13px] border-t border-border pt-[var(--grid-gap)]">
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Uses</dt>
                        <dd className="font-medium tabular-nums">
                          {coupon.usedCount}/{coupon.maxUses || "∞"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-fg-muted">Expires</dt>
                        <dd className="tabular-nums">
                          {coupon.expiresAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto pt-[var(--grid-pad)]">
                      <CouponActiveToggle
                        couponId={coupon.id}
                        isActive={coupon.isActive}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
