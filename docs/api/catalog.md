# Course Catalog API

Base path: `/api/catalog` (Next.js App Router — primary product stack)

Courses in EDITH are `Program` records. This API exposes the public Course Finder
and authenticated admin catalogue management as JSON.

## Public

### `GET /api/catalog/courses`

List published courses with Course Finder filters.

| Query | Description |
| --- | --- |
| `suite` | Programme suite (comma-separated `ProgramCategory` values) |
| `category` | Legacy alias for `suite` |
| `duration` | Duration keys (`2d`, `13w`, `1-2y`, `3y`, `3p1y`, `cohort`, `custom`, `program`) |
| `experience` | Experience keys (`0-2`, `2plus`, `5plus`, `8plus`, `10plus`, `none`, `institution`) |
| `q` | Free-text search across name, summary, tags, outcomes |
| `page` | Page number (default `1`) |
| `pageSize` | Page size (default `50`, max `100`) |
| `sort` | `name` (default), `updated`, or `tuition` |

Response shape:

```json
{
  "courses": [{ "id": "...", "slug": "...", "meta": { "durationKey": "1-2y" }, "href": "/courses/..." }],
  "pagination": { "page": 1, "pageSize": 50, "total": 12, "totalPages": 1 },
  "filters": { "applied": { "suite": [], "duration": [], "experience": [] }, "available": [] }
}
```

### `GET /api/catalog/courses/:slug`

Published course detail including active intakes and published syllabus outline
(modules + published lessons; no lesson body).

### `GET /api/catalog/filters`

Available finder options derived from currently published courses, plus suite
totals.

### `GET /api/catalog/categories`

Static programme suites (YGP, PGP, Fellowship/Executive, AMP, CoE).

## Admin (session + `managePrograms`)

Auth: NextAuth session cookie (same as the web app).

### `GET /api/catalog/admin/courses`

Org-scoped list. Query: `status` (`DRAFT|PUBLISHED|ARCHIVED`), `q`.

### `POST /api/catalog/admin/courses`

Create a course (defaults to `DRAFT`). Pricing fields require `managePricing`.

### `GET /api/catalog/admin/courses/:id`

Admin detail including full syllabus tree and application/enrollment counts.

### `PATCH /api/catalog/admin/courses/:id`

Partial update. Pricing fields require `managePricing`.

### `POST /api/catalog/admin/courses/:id/status`

Body: `{ "status": "DRAFT" | "PUBLISHED" | "ARCHIVED" }`.

Publishing requires a linked form definition with at least one published version
(same rule as the admin UI).

## Implementation

| Layer | Path |
| --- | --- |
| Routes | `apps/web/app/api/catalog/**` |
| Service | `apps/web/lib/catalog/service.ts` |
| Schemas | `apps/web/lib/catalog/schemas.ts` |
| Serializers | `apps/web/lib/catalog/serialize.ts` |
| Finder filters | `apps/web/lib/programs/finder-filters.ts` |
| Catalog meta | `apps/web/lib/programs/catalog-meta.ts` |