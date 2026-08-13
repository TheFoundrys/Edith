# API routes

Every route is a Next.js App Router handler under `apps/web/app/api`, served by
the same process as the UI.

## Course catalog

Base: `/api/catalog` — full reference: [catalog.md](./catalog.md)

- `GET /catalog/courses` — published list + finder filters, search, pagination
- `GET /catalog/courses/:slug` — published detail + syllabus outline
- `GET /catalog/filters` — available finder options
- `GET /catalog/categories` — programme suites
- `GET /catalog/dump` — full catalog export
- `GET|POST /catalog/admin/courses` — org list / create (`managePrograms`)
- `GET|PATCH /catalog/admin/courses/:id` — admin detail / update
- `POST /catalog/admin/courses/:id/status` — draft / publish / archive

## Auth

- `GET|POST /auth/[...nextauth]` — Auth.js handler (sign in, sign out, session, callbacks)
- `POST /auth/clear-stale` — drops a session cookie whose user no longer exists

## Integrations

- `POST /crm/enrollment-callback` — CentraCRM enrollment callback (see `lib/crm`)
- `POST /payments/razorpay/webhook` — Razorpay webhook, signature-verified (see `lib/payments`)

## Operations

- `GET /health` — liveness probe used by the container healthcheck and by CD
- `GET /uploads/:path` — serves files from the uploads volume
