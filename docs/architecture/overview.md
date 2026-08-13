# Architecture

EDITH is a single Next.js App Router application in `apps/web`. The UI and the
JSON API are the same process — there is no separate backend service, and one
container serves both.

| Layer | Location | Notes |
| --- | --- | --- |
| Routes and pages | `apps/web/app` | Route groups: `(marketing)`, `(auth)`, `(student)`, `(admin)` |
| HTTP API | `apps/web/app/api` | `catalog`, `auth`, `crm`, `payments`, `uploads`, `health` |
| Domain logic | `apps/web/lib` | Prisma access, auth/roles, CRM and payment adapters, AI plugins |
| Components | `apps/web/components` | Shared UI plus per-area component sets |
| Data | `apps/web/prisma` | Schema and seed; PostgreSQL via Prisma |

Conventions worth knowing:

- Route handlers and server components are thin. Business rules live in `lib/`.
- Client components never import Prisma; anything touching the database stays on
  the server.
- Role capabilities are centralised in `lib/auth/roles.ts` and enforced in
  `middleware.ts` plus per-route checks.
- External systems are behind adapters selected by environment variable, each
  with a `mock` implementation for local work: see `lib/crm`, `lib/payments`,
  and `lib/ai`.

Courses are `Program` records in the schema; the public Course Finder and the
admin catalogue both read through `/api/catalog` (see [`../api/catalog.md`](../api/catalog.md)).

Migrations are hand-written SQL in `database/migrations`, applied deliberately
rather than by `prisma migrate` — see [`../migration/compass-edith-parity.md`](../migration/compass-edith-parity.md)
for why renames in particular must never go through `prisma db push`.
