import "server-only";

import { prisma } from "@/lib/db";
import {
  couponDiscountAmount,
  money,
  resolveOfferedPrincipal,
} from "@/lib/payments/discounts";
import { isCompassDatabase } from "@/lib/db/profile";
import { resolveCourseListPrice } from "@/lib/programs/pricing";

export type CourseQuote = {
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

/** Simple quote for Compass courses (no coupons/offers/settings tables). */
export function buildCompassCourseQuote(program: {
  price: number | null;
  tuitionCurrency: string;
  pricing?: unknown;
  slug?: string | null;
  sku?: string | null;
  domainSlug?: string | null;
}): CourseQuote {
  const listPrice = resolveCourseListPrice(program);
  return {
    currency: program.tuitionCurrency || "INR",
    listPrice: money(listPrice),
    principalAmount: money(listPrice),
    discountAmount: 0,
    gstAmount: 0,
    convenienceFee: 0,
    totalAmount: money(listPrice),
    couponCode: null,
    offerId: null,
  };
}

export async function buildCourseQuote(input: {
  organizationId: string;
  userId: string;
  program: {
    id: string;
    price: number | null;
    tuitionCurrency: string;
    pricing?: unknown;
    slug?: string | null;
    sku?: string | null;
    domainSlug?: string | null;
  };
  couponCode?: string | null;
}): Promise<CourseQuote | { error: string }> {
  if (isCompassDatabase()) {
    if (input.couponCode?.trim()) {
      return { error: "Coupons are not available on compass_dev." };
    }
    return buildCompassCourseQuote(input.program);
  }

  const [settings, offer] = await Promise.all([
    prisma.paymentSettings.findUnique({
      where: { organizationId: input.organizationId },
    }),
    prisma.programOffer.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: input.userId,
        programId: input.program.id,
        status: "OFFERED",
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const listPrice = resolveCourseListPrice(input.program);
  const principalAmount = resolveOfferedPrincipal(
    listPrice,
    offer?.customPrice,
  );
  const normalizedCoupon = input.couponCode?.trim().toUpperCase() || null;
  let discountAmount = 0;

  if (normalizedCoupon) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        organizationId: input.organizationId,
        code: normalizedCoupon,
        isActive: true,
        expiresAt: { gt: new Date() },
        OR: [
          { scope: "GLOBAL" },
          { scope: "SPECIFIC", programs: { some: { id: input.program.id } } },
        ],
      },
    });
    if (!coupon) return { error: "Coupon is invalid or expired." };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return { error: "Coupon usage limit has been reached." };
    }
    discountAmount = couponDiscountAmount(principalAmount, coupon);
  }
  const taxableAmount = Math.max(0, principalAmount - discountAmount);
  const gstPercent = Math.max(settings?.gstPercent ?? 18, 0);
  const conveniencePercent = Math.max(
    settings?.convenienceFeePercent ?? 0,
    0,
  );
  const gstAmount = money((taxableAmount * gstPercent) / 100);
  const convenienceFee = money(
    (taxableAmount * conveniencePercent) / 100,
  );

  return {
    currency: settings?.currency || input.program.tuitionCurrency || "INR",
    listPrice: money(listPrice),
    principalAmount: money(principalAmount),
    discountAmount,
    gstAmount,
    convenienceFee,
    totalAmount: money(taxableAmount + gstAmount + convenienceFee),
    couponCode: normalizedCoupon,
    offerId: offer?.id ?? null,
  };
}
