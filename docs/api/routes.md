# API routes

Base: `/api`

- `GET /health`
- `POST /auth/login|register|logout|forgot-password|reset-password`
- `GET /auth/me`
- `GET /programs/published`
- `GET /programs/slug/:slug`
- `GET|POST /programs/admin`
- `GET /programs/enrollments/me`
- `POST /programs/enroll`
- `GET|POST /modules/*` (announcements, coupons, tickets, badges, forums, payment-settings, email-templates, offers, applications, assignments, quizzes, certificates, profile)
- `POST /payments/checkout`
- `POST /payments/razorpay/webhook`
- `POST /crm/enrollment-callback`

Machine-readable stub: `GET /api/openapi.json`
