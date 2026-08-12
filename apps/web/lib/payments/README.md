# Payments

Pluggable adapters for **course enrollment fees** (`COURSE_FEE` via `/checkout`) and legacy application fees.

## Adapters

| `PAYMENT_ADAPTER` | Behavior |
| --- | --- |
| unset (local/dev) | Defaults to `mock` when `NODE_ENV !== "production"` |
| unset (production) | Defaults to `razorpay` (fail-closed; keys required) |
| `mock` | Local instant checkout; **blocked in production** unless `ALLOW_MOCK_PAYMENTS=true` |
| `razorpay` | Razorpay order + Checkout.js + signature verify (webhook optional backup) |

`completeMockCoursePayment` / `completeMockApplicationFee` refuse to run when mock is not allowed.

## Course fee flow (primary)

1. Student: `/courses/[slug]` → `/enroll/[slug]` → `/checkout?course={slug}`
2. `startCheckout` creates/reuses `Enrollment` (`PENDING`) + `Payment` (`COURSE_FEE`) and a gateway order
3. **Mock:** `completeMockCoursePayment` → enrollment `ACTIVE` (or `PENDING` if CRM must confirm)
4. **Razorpay:** Checkout.js with `order_id` → `verifyCoursePayment` (HMAC of `order_id|payment_id`) → same activation
5. Success: `/payment/success` · Failure (verify fail): `/payment/failed`

Closing the Razorpay modal without paying leaves the payment `PENDING` so retry can reuse the open order.

## Application fee flow (legacy)

1. Admin: `OFFERED` → `FEE_REQUESTED`
2. Student pays via fee panel (when mounted) or admin **Mark fee paid (offline)**
3. On success: payment `PAID`, application `ENROLLED`, learning `Enrollment` upserted `ACTIVE`, CRM status sync

## Env

```bash
# Local default
PAYMENT_ADAPTER=mock

# Razorpay (test or live keys)
PAYMENT_ADAPTER=razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # optional but recommended in staging/prod
```

Currency is normalized to uppercase (seeded programs use `INR`).

## Razorpay webhook

`POST /api/payments/razorpay/webhook` with header `x-razorpay-signature`.

Enable events `payment.captured` and `payment.failed` in the Razorpay dashboard. The webhook verifies with `RAZORPAY_WEBHOOK_SECRET` and completes or fails the matching `Payment` by `providerOrderId` (course or application purpose). Without the secret, verification fails closed.
