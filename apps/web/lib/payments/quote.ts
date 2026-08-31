import "server-only";

import { prisma } from "@/lib/db";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

export async function buildCourseQuote(input: {
  organizationId: string;
  userId: string;
  program: {
    id: string;
    price: number | null;
    tuitionCurrency: string;
  };
  couponCode?: string | null;
}): Promise<CourseQuote | { error: string }> {
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

  const listPrice = Math.max(0, input.program.price ?? 0);
  const principalAmount =
    offer && offer.customPrice >= 0 ? offer.customPrice : listPrice;
  const normalizedCoupon = input.couponCode?.trim().toUpperCase() || null;
  let couponDiscount = 0;

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
    couponDiscount =
      coupon.type === "PERCENTAGE"
        ? principalAmount * (Math.min(Math.max(coupon.value, 0), 100) / 100)
        : Math.max(coupon.value, 0);
  }

  const discountAmount = money(
    Math.min(principalAmount, couponDiscount),
  );
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
