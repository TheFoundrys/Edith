import test from "node:test";
import assert from "node:assert/strict";
import { buildInvoiceNumber, paymentPurposeLabel } from "@/lib/payments/invoice";

test("builds a stable invoice number from payment id and date", () => {
  const paidAt = new Date("2025-09-01T12:00:00.000Z");
  assert.equal(
    buildInvoiceNumber("clx1234567890abcdef", paidAt),
    "INV-20250901-90ABCDEF",
  );
});

test("labels payment purposes for display", () => {
  assert.equal(paymentPurposeLabel("COURSE_FEE"), "Course fee");
  assert.equal(paymentPurposeLabel("APPLICATION_FEE"), "Application fee");
});
