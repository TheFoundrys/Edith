"use server";

import { revalidatePath } from "next/cache";
import { CouponScope, CouponType, OfferStatus, Prisma } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { buildCourseQuote } from "@/lib/payments/quote";

function couponCodeFrom(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function formDate(raw: string) {
  const expiry = new Date(raw);
  return Number.isNaN(expiry.getTime()) ? null : expiry;
}

export async function createCoupon(formData: FormData) {
  const session = await requireCapability("managePricing");
  const organizationId = session.user.organizationId;
  const code = couponCodeFrom(String(formData.get("code") || ""));
  const value = Number(formData.get("value") || 0);
  const expiresAt = formDate(String(formData.get("expiresAt") || ""));
  const description = String(formData.get("description") || "").trim() || null;
  if (!code || code.length < 3 || code.length > 32 || !/^[A-Z0-9_-]+$/.test(code)) {
    return { error: "Use a 3–32 character code with letters, numbers, - or _." };
  }
  if (!expiresAt) return { error: "Expiry date is required." };

  const type = String(formData.get("type") || "PERCENTAGE") as CouponType;
  const scope = String(formData.get("scope") || "GLOBAL") as CouponScope;
  const resolvedType = Object.values(CouponType).includes(type)
    ? type
    : CouponType.PERCENTAGE;
  const resolvedScope = Object.values(CouponScope).includes(scope)
    ? scope
    : CouponScope.GLOBAL;
  const maxUses = Number(formData.get("maxUses") || 0);
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    (resolvedType === CouponType.PERCENTAGE && value > 100) ||
    !Number.isInteger(maxUses) ||
    maxUses < 0 ||
    expiresAt.getTime() <= Date.now()
  ) {
    return {
      error:
        resolvedType === CouponType.PERCENTAGE
          ? "Enter a percent between 0 and 100, a future expiry, and a usage limit."
          : "Enter a positive amount, a future expiry, and a usage limit.",
    };
  }

  const selectedProgramIds = formData
    .getAll("programIds")
    .map((id) => String(id).trim())
    .filter(Boolean);
  if (resolvedScope === CouponScope.SPECIFIC && selectedProgramIds.length === 0) {
    return { error: "Choose at least one program for a course-specific coupon." };
  }

  const programs =
    resolvedScope === CouponScope.SPECIFIC
      ? await prisma.program.findMany({
          where: { organizationId, id: { in: selectedProgramIds } },
          select: { id: true },
        })
      : [];
  if (
    resolvedScope === CouponScope.SPECIFIC &&
    programs.length !== selectedProgramIds.length
  ) {
    return { error: "Choose programs from this organization." };
  }

  try {
    await prisma.coupon.create({
      data: {
        organizationId,
        code,
        value,
        type: resolvedType,
        scope: resolvedScope,
        description,
        maxUses,
        expiresAt,
        isActive: formData.get("isActive") !== "off",
        createdBy: session.user.id,
        programs:
          resolvedScope === CouponScope.SPECIFIC
            ? { connect: programs.map((program) => ({ id: program.id })) }
            : undefined,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "That coupon code already exists." };
    }
    throw error;
  }

  await recordAudit({
    organizationId,
    actor: session.user,
    action: "COUPON_CREATED",
    entityType: "Coupon",
    targetResource: code,
    metadata: {
      code,
      value,
      type: resolvedType,
      scope: resolvedScope,
      maxUses,
    },
  });
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function setCouponActive(couponId: string, isActive: boolean) {
  const session = await requireCapability("managePricing");
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, organizationId: session.user.organizationId },
    select: { id: true, code: true },
  });
  if (!coupon) return { error: "Coupon not found." };

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { isActive },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: isActive ? "COUPON_ACTIVATED" : "COUPON_PAUSED",
    entityType: "Coupon",
    entityId: coupon.id,
    targetResource: coupon.code,
  });
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function createProgramOffer(formData: FormData) {
  const session = await requireCapability("managePricing");
  const organizationId = session.user.organizationId;
  const userId = String(formData.get("userId") || "");
  const programId = String(formData.get("programId") || "");
  if (!userId || !programId) return { error: "Choose a student and a program." };
  const customPrice = Number(formData.get("customPrice") || 0);
  if (!Number.isFinite(customPrice) || customPrice <= 0) {
    return { error: "Set a custom tuition greater than zero." };
  }

  const [membership, program] = await Promise.all([
    prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true },
    }),
    prisma.program.findFirst({
      where: { id: programId, organizationId },
      select: { id: true },
    }),
  ]);
  if (!membership || !program) {
    return { error: "Select a student and program from this organization." };
  }

  const existing = await prisma.programOffer.findFirst({
    where: {
      organizationId,
      userId,
      programId,
      status: OfferStatus.OFFERED,
    },
    orderBy: { createdAt: "desc" },
  });

  const offer = existing
    ? await prisma.programOffer.update({
        where: { id: existing.id },
        data: {
          customPrice,
          tokenRequired: 0,
          discountAmount: 0,
          discountType: null,
        },
      })
    : await prisma.programOffer.create({
        data: {
          organizationId,
          userId,
          programId,
          customPrice,
          tokenRequired: 0,
          discountAmount: 0,
          status: OfferStatus.OFFERED,
        },
      });

  await recordAudit({
    organizationId,
    actor: session.user,
    action: existing ? "PROGRAM_OFFER_UPDATED" : "PROGRAM_OFFER_CREATED",
    entityType: "ProgramOffer",
    entityId: offer.id,
    metadata: { userId, programId, customPrice },
  });
  revalidatePath("/admin/offers");
  return { ok: true as const };
}

export async function withdrawProgramOffer(offerId: string) {
  const session = await requireCapability("managePricing");
  const offer = await prisma.programOffer.findFirst({
    where: { id: offerId, organizationId: session.user.organizationId },
    select: { id: true, status: true },
  });
  if (!offer) return { error: "Offer not found." };
  if (offer.status !== OfferStatus.OFFERED) {
    return { error: "Only a live offer can be withdrawn." };
  }

  await prisma.programOffer.update({
    where: { id: offer.id },
    data: { status: OfferStatus.WITHDRAWN },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "PROGRAM_OFFER_WITHDRAWN",
    entityType: "ProgramOffer",
    entityId: offer.id,
  });
  revalidatePath("/admin/offers");
  return { ok: true as const };
}

export async function previewCourseQuote(
  programSlug: string,
  couponCode?: string,
) {
  const session = await requireStudent();
  const program = await prisma.program.findFirst({
    where: {
      organizationId: session.user.organizationId,
      slug: programSlug,
      status: "PUBLISHED",
    },
  });
  if (!program) return { error: "Course not found." };

  return buildCourseQuote({
    organizationId: session.user.organizationId,
    userId: session.user.id,
    program,
    couponCode,
  });
}
