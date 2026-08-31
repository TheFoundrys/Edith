export type CoursePricingFields = {
  price: number | null;
};

/** Tuition amount charged at course checkout. Application fees are separate. */
export function coursePrice(program: CoursePricingFields): number {
  if (program.price != null && program.price > 0) {
    return program.price;
  }
  return 0;
}

export function isFreeCourse(program: CoursePricingFields): boolean {
  return coursePrice(program) === 0;
}
