# CentraCRM Integration (The Foundrys)

API docs: https://dev-crm.thefoundrys.com/api-docs/  
Base URL: `https://dev-crm.thefoundrys.com/api/v1`

## Env

```bash
CRM_ADAPTER=centracrm
CRM_BASE_URL=https://dev-crm.thefoundrys.com/api/v1
CRM_TENANT_ID=<tenant uuid>          # required for POST /leads/public
CRM_DEFAULT_CATALOG_ID=<program id>  # optional; otherwise matched by program name
CRM_EMAIL=<service user>             # optional; required for status PATCH
CRM_PASSWORD=<service password>      # optional; required for status PATCH
CRM_WEBHOOK_SECRET=<shared secret>   # required for inbound CRM → Edith webhooks
CRM_APP_URL=https://dev-crm.thefoundrys.com  # optional; browser origin for redirects
```

## Flows

Edith **redirects all application UIs** to the CRM web app (`CRM_APP_URL`, or `CRM_BASE_URL` without `/api/v1`):

- `/student/applications` → `{CRM}/applications?source=edith`
- `/admin/applications` → `{CRM}/applications`
- Apply buttons on `/enroll/[slug]` use the same handoff

Academic applications, documents, admission letters, and fee confirmations live in CRM (`GET/POST /applications`, `GET /applications/{id}/letter`, document APIs). Direct course enrolment (no application form) stays in Edith.

**Degree programmes:** apply and track admission in CRM only. After CRM admits a student, call Edith to unlock LMS access (see below). Tuition payment in Edith is allowed only after that admission callback creates an ACTIVE enrollment.

**YGP / PGP content courses:** direct enroll and pay in Edith; optional `requiresCrmCallback` gate uses the enrollment callback instead.

### Application submitted → CRM lead (+ application)

`POST /leads/public` (no auth)

```json
{
  "tenantId": "...",
  "name": "...",
  "email": "...",
  "phone": "...",
  "leadSource": "EDITH",
  "interestedCatalogId": "<from GET /programs/public>",
  "qualification": "...",
  "eduBackground": "...",
  "additionalData": { "atlasApplicationId": "...", "programName": "..." }
}
```

When `interestedCatalogId` is set, CentraCRM also creates an academic application and returns `applicationId`.

### Status change → CRM sync

With `CRM_EMAIL` / `CRM_PASSWORD`:

- `PATCH /applications/{id}/status` — `{ status }` mapped via `status-map.ts`
- `PATCH /leads/{id}` — `{ stage }` mapped via `status-map.ts`

Without credentials, lead creation still works; status sync is logged as failed with a clear message (student UX is never blocked).

### CRM admission → Edith LMS (degree programmes)

When CentraCRM approves an academic application, POST to Edith:

`POST /api/crm/admission-callback`

Auth: `Authorization: Bearer $CRM_WEBHOOK_SECRET` or header `x-crm-webhook-secret`.

```json
{
  "email": "student@example.com",
  "programSlug": "bsc-ai",
  "status": "ENROLLED",
  "crmApplicationId": "...",
  "crmLeadId": "...",
  "intakeId": "...",
  "note": "Admitted for 2026 intake"
}
```

`status` admit values: `ENROLLED`, `ADMITTED`, `APPROVED`, `ACCEPTED`. Reject: `REJECTED`, `DECLINED`, `WITHDRAWN`.

The student must already have an Edith account with the same email. On admit, Edith creates an ACTIVE enrollment and notifies the student. Rejected admissions cancel any unpaid enrollment.

### Direct enroll CRM confirmation (YGP/PGP with requiresCrmCallback)

`POST /api/crm/enrollment-callback` — approve/reject an existing Edith `enrollmentId` after the student enrolls or pays in Edith.

```json
{
  "enrollmentId": "...",
  "status": "APPROVED",
  "leadId": "...",
  "note": "..."
}
```

### Catalog

`GET /programs/public` — used to resolve `interestedCatalogId` by program name.

## Adapter switch

| `CRM_ADAPTER` | Behavior |
| --- | --- |
| `mock` | Local stub (default if unset) |
| `centracrm` / `foundrys` / `onecrm` | Live CentraCRM adapter |
