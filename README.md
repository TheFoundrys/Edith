# EDITH

Primary app: **Next.js** UI in [`apps/web`](apps/web) (original marketing / admin / student experience).

```bash
cd apps/web && npm install   # once
npm run dev                  # from repo root → Next on :3059
```

Prisma / DB scripts also proxy to `apps/web` (`db:generate`, `db:push`, `db:seed`).

## Docker

```bash
cp apps/web/.env.example apps/web/.env
docker compose up -d --build          # http://localhost:3059
```

Server: `git pull` then `docker compose up -d --build`.
Set `AUTH_URL` / `NEXTAUTH_URL` in `apps/web/.env` to the live domain.

`npm run db:seed` deletes all users. Local only.

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) (lint, typecheck, build).
Deploy is `git pull` on the box — there is no CD pipeline.
