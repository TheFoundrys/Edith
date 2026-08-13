# Deploy

On the server:

```bash
cd ~/Edith
git pull
# edit apps/web/.env — AUTH_URL and NEXTAUTH_URL must be the live domain
docker compose up -d --build
```

That is the whole deploy. No extra compose file. No `WEB_IMAGE`.

`apps/web/.env` must use the public URL, not localhost:

```
AUTH_URL="https://your-domain"
NEXTAUTH_URL="https://your-domain"
AUTH_SECRET="<openssl rand -base64 32>"
DATABASE_URL="postgresql://..."
```

Do not copy the laptop `.env` onto the server.

Do not run `npm run db:seed` on this machine. It deletes users.
