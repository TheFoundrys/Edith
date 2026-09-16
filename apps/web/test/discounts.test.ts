import test from "node:test";
import assert from "node:assert/strict";
import {
  couponDiscountAmount,
  couponDiscountLabel,
  couponLifecycle,
  couponLifecycleLabel,
  money,
  offerStatusLabel,
  resolveOfferedPrincipal,
} from "../lib/payments/discounts";

test("offer custom price replaces catalog list price", () => {
  assert.equal(resolveOfferedPrincipal(50000, 35000), 35000);
  assert.equal(resolveOfferedPrincipal(50000, 0), 50000);
  assert.equal(resolveOfferedPrincipal(50000, null), 50000);
});

test("percentage coupons discount the offered principal", () => {
  assert.equal(
    couponDiscountAmount(35000, { type: "PERCENTAGE", value: 10 }),
    3500,
  );
  assert.equal(
    couponDiscountAmount(35000, { type: "PERCENTAGE", value: 150 }),
    35000,
  );
});

test("fixed coupons never exceed the principal", () => {
  assert.equal(couponDiscountAmount(35000, { type: "FIXED", value: 2500 }), 2500);
  assert.equal(couponDiscountAmount(1000, { type: "FIXED", value: 2500 }), 1000);
});

test("coupon lifecycle follows active, expiry, and usage caps", () => {
  const now = new Date("2026-09-11T12:00:00.000Z");
  const base = {
    isActive: true,
    expiresAt: new Date("2026-10-01T00:00:00.000Z"),
    maxUses: 10,
    usedCount: 2,
  };
  assert.equal(couponLifecycle(base, now), "LIVE");
  assert.equal(
    couponLifecycle({ ...base, isActive: false }, now),
    "INACTIVE",
  );
  assert.equal(
    couponLifecycle(
      { ...base, expiresAt: new Date("2026-09-01T00:00:00.000Z") },
      now,
    ),
    "EXPIRED",
  );
  assert.equal(
    couponLifecycle({ ...base, maxUses: 2, usedCount: 2 }, now),
    "EXHAUSTED",
  );
});

test("labels coupons and offers for admin lists", () => {
  assert.equal(
    couponDiscountLabel({ type: "PERCENTAGE", value: 15 }),
    "15% off",
  );
  assert.equal(couponLifecycleLabel("LIVE"), "Live");
  assert.equal(offerStatusLabel("OFFERED"), "Live");
  assert.equal(offerStatusLabel("WITHDRAWN"), "Withdrawn");
  assert.equal(money(10.005), 10.01);
});
