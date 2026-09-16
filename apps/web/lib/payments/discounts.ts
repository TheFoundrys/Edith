export type CouponKind = "PERCENTAGE" | "FIXED";

export type CouponLifecycle = "LIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED";

export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function resolveOfferedPrincipal(
  listPrice: number,
  customPrice: number | null | undefined,
) {
  return customPrice != null && customPrice > 0 ? customPrice : listPrice;
}

export function couponDiscountAmount(
  principal: number,
  coupon: { type: CouponKind; value: number },
) {
  const raw =
    coupon.type === "PERCENTAGE"
      ? principal * (Math.min(Math.max(coupon.value, 0), 100) / 100)
      : Math.max(coupon.value, 0);
  return money(Math.min(Math.max(principal, 0), raw));
}

export function couponLifecycle(
  coupon: {
    isActive: boolean;
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
  },
  now = new Date(),
): CouponLifecycle {
  if (!coupon.isActive) return "INACTIVE";
  if (coupon.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return "EXHAUSTED";
  }
  return "LIVE";
}

export function couponLifecycleLabel(status: CouponLifecycle) {
  if (status === "LIVE") return "Live";
  if (status === "INACTIVE") return "Paused";
  if (status === "EXPIRED") return "Expired";
  return "Used up";
}

export function couponDiscountLabel(
  coupon: { type: CouponKind; value: number },
  currency = "INR",
) {
  if (coupon.type === "PERCENTAGE") {
    return `${coupon.value}% off`;
  }
  return `${formatPlainCurrency(coupon.value, currency)} off`;
}

export function offerStatusLabel(status: string) {
  if (status === "OFFERED") return "Live";
  if (status === "WITHDRAWN") return "Withdrawn";
  if (status === "TOKEN_PAID") return "Token paid";
  if (status === "ADMITTED") return "Admitted";
  return status.replaceAll("_", " ");
}

function formatPlainCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
