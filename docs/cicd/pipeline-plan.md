# CI/CD Pipeline Plan — EDITH / Foundryxs

Plan for an automated continuous integration and continuous delivery pipeline covering PR validation through production deploy with health checks and rollback.

## Goals

- Catch failures early (lint, types, unit, integration) before merge.
- Ship only verified artifacts (build + Docker image) to staging and production.
- Require human approval before production.
- Fail closed: any red stage blocks the next; production can roll back on health-check failure.

## Stack assumptions

| Area | Current project |
| --- | --- |
| App | Next.js (`apps/web`) + Prisma + PostgreSQL |
| Package manager | pnpm (workspace: `apps/*`) |
| Quality | ESLint, TypeScript |
| Tests | Vitest (unit / integration); E2E under `tests/e2e` |
| Containers | `docker-compose.yml` (postgres, api, web) |
| Environments | local → staging → production |

---

## Pipeline overview

```text
Push / Pull Request
        ↓
Install dependencies
        ↓
Lint + Type check
        ↓
Unit tests
        ↓
Integration / API tests
        ↓
Build frontend + backend
        ↓
Docker build
        ↓
Security checks
        ↓
Deploy to staging
        ↓
E2E tests
        ↓
Production approval
        ↓
Deploy production
        ↓
Health check / rollback
```

**Trigger rules (recommended)**

| Event | Stages run |
| --- | --- |
| PR / push to feature branch | Install → Security (deps) → Lint/Type → Unit → Integration → Build → Docker build |
| Merge / push to `main` (or `develop`) | Full path through **Deploy staging** + **E2E** |
| Manual / approved promote | **Production approval** → **Deploy production** → **Health check / rollback** |

---

## Stage details

### 1. Push / Pull Request

**Purpose:** Start the pipeline on every change that might ship.

**Actions**

- Trigger on `pull_request` and `push` to protected branches (`main`, `develop`).
- Cancel in-progress runs for the same branch (concurrency group).
- Checkout with full or shallow history as needed for changelogs / Nx-style filters later.
- Set CI env vars (Node version, `CI=true`, non-interactive pnpm).

**Exit criteria:** Repo checked out; runner ready.

---

### 2. Install dependencies

**Purpose:** Reproducible dependency tree for all later jobs.

**Actions**

```bash
# from repo root (or apps/web if scoped)
pnpm install --frozen-lockfile
```

- Cache `~/.pnpm-store` (and Next.js `.next/cache` where useful) keyed by lockfile hash.
- Run Prisma generate as needed (`postinstall` / `pnpm db:generate` in `apps/web`).
- Prefer a single install job; later jobs reuse the workspace via cache or artifacts.

**Exit criteria:** Lockfile respected; `node_modules` / store available; Prisma client generated.

**On failure:** Fail the pipeline (do not continue).

---

### 3. Lint + Type check

**Purpose:** Enforce style and static correctness before tests.

**Actions**

```bash
# apps/web (primary app)
cd apps/web
pnpm lint
pnpm exec tsc --noEmit
```

- Optionally run root `eslint` / `tsc` if the Vite/Express tree is still in use.
- Treat warnings as errors in CI (`eslint --max-warnings 0`) once the baseline is clean.

**Exit criteria:** Lint and typecheck exit 0.

**On failure:** Block merge / block later stages.

---

### 4. Unit tests

**Purpose:** Fast, isolated coverage of business logic and UI helpers.

**Actions**

```bash
# align with package scripts as they land
pnpm test -- --project unit
# or: vitest run tests/unit
```

- Target: `tests/unit` (backend / frontend / shared).
- No real network or production DB; use mocks/fixtures under `tests/mocks` and `tests/fixtures`.
- Publish coverage (optional gate: minimum % once baseline exists).

**Exit criteria:** All unit tests pass.

---

### 5. Integration / API tests

**Purpose:** Verify API routes, services, and DB behavior against a real test database.

**Actions**

- Start ephemeral PostgreSQL (service container or `docker compose` postgres only).
- Set `DATABASE_URL` to a dedicated CI database (never production / never shared `compass_dev`).
- Apply schema: `pnpm db:push` or migrate in `apps/web`.
- Run integration suite: `tests/integration` (api / database / services).
- Prefer CRM/payment adapters in mock mode (`CRM_ADAPTER=mock`, `PAYMENT_ADAPTER=mock`).

**Exit criteria:** Integration suite green; DB teardown optional (ephemeral runners discard state).

**On failure:** Do not build or deploy.

---

### 6. Build frontend + backend

**Purpose:** Prove production builds succeed with CI env placeholders.

**Actions**

```bash
cd apps/web
pnpm build          # next build
```

- If root Vite + Express API remains in the release path:

```bash
pnpm build:web && pnpm build:api
```

- Inject build-time public env only (e.g. `NEXT_PUBLIC_*`); secrets stay in deploy env.
- Upload build artifacts (`.next`, `dist`, static assets) for deploy jobs if not rebuilding inside Docker.

**Exit criteria:** Build completes; artifacts stored (or image build will compile again from clean context).

---

### 7. Docker build

**Purpose:** Produce the deployable image(s) used by staging and production.

**Actions**

```bash
docker compose build
# or: docker build --target web / --target api
```

- Tag images: `edith-web:<git-sha>`, `edith-api:<git-sha>`, plus `:staging` / `:prod` on promote.
- Multi-stage Dockerfile (as referenced by `docker-compose.yml` targets `api` / `web`).
- Push to container registry (GHCR / ECR / etc.) on `main` and on release tags.
- Optionally run a smoke `docker compose up` + curl health endpoint before push.

**Exit criteria:** Images built (and pushed when on deploy branches).

---

### 8. Security checks

**Purpose:** Reduce supply-chain and image risk before staging.

**Actions (recommended set)**

| Check | Example |
| --- | --- |
| Dependency audit | `pnpm audit` (or `osv-scanner` / Snyk) |
| Secret scan | gitleaks / trufflehog on the diff |
| SAST (optional) | CodeQL or Semgrep |
| Container scan | Trivy / Grype on built images |
| License (optional) | license-checker for blocked licenses |

- Fail on high/critical vulnerabilities in direct deps and base images; document exceptions with expiry.
- Never print secrets in logs; mask CI secret variables.

**Exit criteria:** Policy thresholds met; findings uploaded as CI annotations.

**Placement note:** Lightweight dep/secret scans can also run right after install (fail fast). Full image scan must run after Docker build.

---

### 9. Deploy to staging

**Purpose:** Promote the exact image (or build) that passed CI into a staging environment.

**Actions**

- Deploy only from `main` (or tagged release candidates).
- Apply Prisma migrations against **staging** DB (not `db:push` in prod-like envs if migrations are the source of truth).
- Set staging secrets: `DATABASE_URL`, Auth, Razorpay test keys, CRM staging credentials, etc.
- Roll out via platform of choice (Docker Compose on a VM, ECS/Kubernetes, Vercel for web + separate API host).
- Record deployed git SHA and image digest.

**Exit criteria:** Staging URL reachable; migrate job succeeded.

**On failure:** Leave previous staging revision running; alert channel.

---

### 10. E2E tests

**Purpose:** Validate critical user journeys against staging (not mocks).

**Actions**

- Point Playwright/Cypress (or existing `tests/e2e`) at staging base URL.
- Cover: auth, apply/submit, admin inbox, checkout (mock or Razorpay test), enrolled learning smoke paths.
- Use seeded staging accounts (rotate credentials; never use production passwords in CI docs).
- Capture traces/screenshots on failure; retain artifacts for ~7–14 days.

**Exit criteria:** Critical E2E suite green.

**On failure:** Block production promotion; leave staging for debugging.

---

### 11. Production approval

**Purpose:** Human gate before customer impact.

**Actions**

- Required reviewers / environment protection rules (e.g. GitHub Environments: `production`).
- Checklist: staging E2E green, change notes, migration review, feature flags, on-call aware.
- Optional: scheduled maintenance window for breaking migrations.

**Exit criteria:** Explicit approve action in CI/CD UI.

---

### 12. Deploy production

**Purpose:** Ship the same artifact that was validated on staging.

**Rules**

- Deploy **the same image digest** tested on staging (no rebuild from a newer commit).
- Run production migrations carefully (backward-compatible when possible; expand/contract pattern).
- Payments: `PAYMENT_ADAPTER=razorpay`; never `ALLOW_MOCK_PAYMENTS=true`.
- CRM: production CentraCRM credentials only via secrets manager.

**Exit criteria:** New revision live (or traffic shifted if blue/green).

---

### 13. Health check / rollback

**Purpose:** Confirm production is healthy; undo automatically or quickly if not.

**Health checks**

- HTTP: `/api/health` (or app equivalent) returns 200 within SLA.
- Dependency checks: DB connect, critical external APIs (soft-fail vs hard-fail as designed).
- Smoke: login page loads; one authenticated admin route OK.
- Observe error rate / latency for a short soak window (e.g. 5–15 minutes).

**Rollback**

| Condition | Action |
| --- | --- |
| Health endpoint fails repeatedly | Redeploy previous image digest |
| Migration failure mid-deploy | Stop rollout; restore DB from backup / reverse migration if available |
| Elevated 5xx after soak | Manual or automatic rollback to last-known-good |

- Document last-known-good SHA/digest in deploy metadata.
- Alert Slack/email on rollback.

**Exit criteria:** Health green for soak window **or** successful rollback + incident note.

---

## Suggested job graph (GitHub Actions–style)

```text
PR / push
  └─ install
       ├─ lint-typecheck
       ├─ unit
       ├─ integration   (needs postgres service)
       └─ (after tests) build
            └─ docker-build
                 └─ security (image + deps)

main merge
  └─ (all of the above)
       └─ deploy-staging
            └─ e2e-staging
                 └─ [manual] approve-production
                      └─ deploy-production
                           └─ health-or-rollback
```

Parallelize lint, unit, and integration after install where runners allow. Keep Docker build after app build (or fold compile into the Dockerfile and drop the separate build job if preferred).

---

## Environments & secrets

| Secret / config | Staging | Production |
| --- | --- | --- |
| `DATABASE_URL` | staging DB | prod DB |
| Auth / session secrets | staging | prod |
| `CRM_*` | CentraCRM staging | CentraCRM prod |
| `PAYMENT_ADAPTER` | mock or razorpay test | `razorpay` |
| `RAZORPAY_*` | test keys | live keys |
| `ALLOW_PUBLIC_REGISTRATION` | as needed | usually `false` |
| Container registry creds | yes | yes |

Store secrets in the CI/CD environment store or cloud secret manager — never in the repo or image layers.

---

## Branch & protection policy

- `main` (or `release/*`): protected; require PR + green CI + review.
- Feature branches: open PR → validation pipeline only (no staging deploy unless opted in).
- Hotfix: same pipeline; optional expedited approval with documented risk.

---

## Implementation checklist

- [ ] Add `.github/workflows/ci.yml` (install → lint → typecheck → unit → integration → build → docker).
- [ ] Add Postgres service / compose for integration tests.
- [ ] Add registry login + image push on `main`.
- [ ] Add security jobs (audit, secret scan, Trivy).
- [ ] Add `staging` and `production` GitHub Environments (or equivalent) with protection rules.
- [ ] Wire staging deploy + E2E against staging URL.
- [ ] Define `/api/health` (or Next.js health route) and rollback job.
- [ ] Document runbooks: failed migration, rollback, secret rotation.

---

## Success metrics

- PR feedback time (lint + unit) under a fixed target (e.g. &lt; 10 minutes).
- Zero production deploys without staging E2E green + approval.
- Rollback exercised in a drill at least once per quarter.
- Critical vulnerability SLAs defined and tracked in CI reports.

---

## Out of scope (later)

- Canary / percentage traffic shifting.
- Preview environments per PR.
- Full Chaos / load testing in the default path.
- Multi-region active-active.

These can extend the same stage model without changing the core flow above.
