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
docker compose run --rm prisma            # apply the schema (prisma db push)
docker compose run --rm --entrypoint npx prisma tsx prisma/seed.ts  # optional seed
```

The runtime image ships no Prisma CLI, so schema work goes through the one-shot
`prisma` service, which reuses the build stage.

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

An experimental SPA + Express layout remains under `src/`, `api/`, and `database/` (`npm run dev:spa`). Day-to-day product UI is the Next app, and it is the only thing `docker compose` builds.
# Atlas
