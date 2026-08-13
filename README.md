# EDITH

Primary app: **Next.js** UI in [`apps/web`](apps/web) (original marketing / admin / student experience).

```bash
cd apps/web && npm install   # once
npm run dev                  # from repo root → Next on :3059
```

Prisma / DB scripts also proxy to `apps/web` (`db:generate`, `db:push`, `db:seed`).

## Docker deployment

Next.js serves the UI and the `/api` routes from one process, so the whole app
is published on a single non-default port. Nothing runs on 3000, 5173, or 5432.

| Service                     | Port |
| --------------------------- | ---- |
| `web` (Next UI + API)       | 3059 |
| `postgres`                  | 5439 |

```bash
cp apps/web/.env.example apps/web/.env    # fill in AUTH_SECRET, DATABASE_URL, CRM_*, RAZORPAY_*
docker compose up -d --build              # app on http://localhost:3059
docker compose run --rm prisma            # BRAND-NEW EMPTY DB ONLY (prisma db push)
docker compose run --rm --entrypoint npx prisma tsx prisma/seed.ts  # optional seed
```

The runtime image ships no Prisma CLI, so schema work goes through one-shot
services that reuse the build stage.

> **On any database that already holds data, use `docker compose run --rm migrate`,
> never `prisma db push`.** Push implements a column rename as DROP + ADD, so it
> destroys every value in the renamed columns — password hashes included. The
> `migrate` service applies the reviewed SQL in `database/migrations` in order,
> using `ALTER TABLE ... RENAME COLUMN`. Both are idempotent.
>
> `npm run db:seed` is destructive and for development only: it opens by deleting
> all users, organizations, programmes, applications and payments. To publish
> courses to a server that has real users, use `npm run db:publish-catalog`,
> which only ever creates what is missing. See
> [the deployment runbook](docs/deploy/ubuntu-server.md#publishing-catalogue-content).

Course content lives in `apps/web/prisma/catalog-data.ts`, read by both the
development seeder and the production publisher so the two cannot drift.

To use the bundled database, set `DATABASE_URL` in `apps/web/.env` to
`postgresql://postgres:postgres@postgres:5439/edith_dev?schema=public` (the
compose service name and its non-default port). Point it anywhere else and the
`postgres` service is simply unused.

Overrides, all optional: `APP_PORT` (host port), `APP_ORIGIN` (public origin
used for `AUTH_URL`/`NEXTAUTH_URL`), `POSTGRES_PORT`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`. Uploads and Postgres data live in the
`edith_uploads` and `edith_pg` volumes. Health check: `GET /api/health`.

Behind a TLS terminator, set `APP_ORIGIN=https://your-domain` and proxy it to
`3059`.

Hand-written SQL migrations live in [`database/migrations`](database/migrations); the
Prisma schema and seed they accompany are in [`apps/web/prisma`](apps/web/prisma).

## CI/CD

| Workflow | Trigger | Does |
| --- | --- | --- |
| [`ci.yml`](.github/workflows/ci.yml) | every PR, pushes to `main` / `dev` | lint, typecheck, `next build`, then boots the Docker image against Postgres and checks `/api/health` and `/login` |
| [`cd.yml`](.github/workflows/cd.yml) | push to `dev` → staging, push to `main` → production, or manual | publishes images to GHCR, deploys the exact digest over SSH, health-checks it, and rolls back if it fails |

Deploy configuration lives in GitHub Environments (`staging`, `production`):

| Name | Kind | Value |
| --- | --- | --- |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` | secret | SSH access to the server |
| `DEPLOY_KNOWN_HOSTS` | secret | optional; pins the host key |
| `DEPLOY_SSH_PORT` | secret | optional, defaults to `22` |
| `DEPLOY_PATH` | variable | checkout path on the server, e.g. `/srv/foundryxs` |
| `HEALTH_URL` | variable | public `…/api/health` for that environment |

Add required reviewers to the `production` environment to gate promotion. Schema
changes are not applied automatically — run the workflow manually with
**Apply the Prisma schema** checked. Full server setup: [`docs/deploy/ubuntu-server.md`](docs/deploy/ubuntu-server.md).
