export type CoursePricingFields = {
  price: number | null;
  pricing?: unknown;
  slug?: string | null;
  sku?: string | null;
  domainSlug?: string | null;
};

/** Mandatory Edith Personality Profile sitting fee (INR). */
export const PERSONALITY_ASSESSMENT_FEE_INR = 3500;

function pricingInr(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const tier = value as Record<string, unknown>;
  const inr = tier.INR;
  return typeof inr === "number" && inr > 0 ? inr : null;
}

/** Resolve list price from `price`, tiered `pricing` JSON, or programme defaults. */
export function resolveCourseListPrice(program: CoursePricingFields): number {
  const direct = coursePrice({ price: program.price });
  if (direct > 0) return direct;

  if (program.pricing && typeof program.pricing === "object") {
    const pricing = program.pricing as Record<string, unknown>;
    const fromOriginal = pricingInr(pricing.original);
    if (fromOriginal) return fromOriginal;
    const fromFreshers = pricingInr(pricing.freshers);
    if (fromFreshers) return fromFreshers;
  }

  if (
    program.slug === "edith-personality-profile" ||
    program.sku === "ASSESS 001" ||
    program.domainSlug === "assessments"
  ) {
    return PERSONALITY_ASSESSMENT_FEE_INR;
  }

  return 0;
}

/** Tuition amount charged at course checkout. Application fees are separate. */
export function coursePrice(program: Pick<CoursePricingFields, "price">): number {
  if (program.price != null && program.price > 0) {
    return program.price;
  }
  return 0;
}

export function isFreeCourse(program: CoursePricingFields): boolean {
  return resolveCourseListPrice(program) === 0;
}
