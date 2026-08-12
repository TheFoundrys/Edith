# EDITH

Primary app: **Next.js** UI in [`apps/web`](apps/web) (original marketing / admin / student experience).

```bash
cd apps/web && npm install   # once
npm run dev                  # from repo root → Next on :3000
```

Prisma / DB scripts also proxy to `apps/web` (`db:generate`, `db:push`, `db:seed`).

An experimental SPA + Express layout remains under `src/`, `api/`, and `database/` (`npm run dev:spa`). Day-to-day product UI is the Next app.
# Atlas
