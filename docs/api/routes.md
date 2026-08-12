# API routes

## Next.js (primary) — Course Catalog

Base: `/api/catalog`

Full reference: [catalog.md](./catalog.md)

- `GET /catalog/courses` — published list + finder filters, search, pagination
- `GET /catalog/courses/:slug` — published detail + syllabus outline
- `GET /catalog/filters` — available finder options
- `GET /catalog/categories` — programme suites
- `GET|POST /catalog/admin/courses` — org list / create (`managePrograms`)
- `GET|PATCH /catalog/admin/courses/:id` — admin detail / update
- `POST /catalog/admin/courses/:id/status` — draft / publish / archive

## Express (SPA stack)

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
