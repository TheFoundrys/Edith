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
```

## Flows

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

### Catalog

`GET /programs/public` — used to resolve `interestedCatalogId` by program name.

## Adapter switch

| `CRM_ADAPTER` | Behavior |
| --- | --- |
| `mock` | Local stub (default if unset) |
| `centracrm` / `foundrys` / `onecrm` | Live CentraCRM adapter |
