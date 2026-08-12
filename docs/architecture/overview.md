# Architecture

EDITH runs as a Vite React SPA talking to an Express API over JSON + httpOnly cookies.

- Frontend never imports Prisma.
- Backend services own business rules; `api/routes` are thin HTTP adapters.
- Shared package holds role capabilities and Zod schemas used by both sides where needed.

See the SPA + Express restructure plan for migration history from Next.js.
