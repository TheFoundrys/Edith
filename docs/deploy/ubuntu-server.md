# Docker Deployment — Ubuntu Server

How to run EDITH on a fresh Ubuntu server (22.04 / 24.04) with Docker Compose.

Next.js serves the UI and the `/api` routes from a single process, so there is
one app container, not a separate frontend and backend. Every port is off the
framework defaults.

| Service | Container port | Published on the host |
| --- | --- | --- |
| `web` (Next UI + API) | 3059 | `0.0.0.0:3059` (override with `APP_BIND`) |
| `postgres` | 5439 | `127.0.0.1:5439` (loopback only) |

---

## 1. Prepare the server

Log in as a sudo-capable user (not root) and update the base system.

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y git curl ca-certificates
```

**Add swap if the box has less than 2 GB of RAM.** `next build` compiles the
whole app in one pass and gets OOM-killed on small droplets; the failure looks
like an unexplained `exit code 137` during `docker compose build`.

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Install Docker Engine

Use Docker's own apt repository. The `docker.io` package in the Ubuntu archive
is older and ships no `docker compose` plugin.

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

Let your user run Docker without `sudo`, then start a new shell so the group
membership applies:

```bash
sudo usermod -aG docker "$USER"
newgrp docker
docker compose version
sudo systemctl enable --now docker   # survives reboots
```

## 3. Get the code

```bash
sudo mkdir -p /srv && sudo chown "$USER":"$USER" /srv
cd /srv
git clone <your-repo-url> foundryxs
cd foundryxs
```

## 4. Configure environment

Two files matter, and they do different jobs:

| File | Read by | Holds |
| --- | --- | --- |
| `apps/web/.env` | the app inside the container (`env_file`) | `DATABASE_URL`, `AUTH_SECRET`, `CRM_*`, `RAZORPAY_*` |
| `.env` (repo root) | Compose itself, for `${...}` substitution | `APP_ORIGIN`, `APP_BIND`, `POSTGRES_PASSWORD`, port overrides |

Create the app environment and generate a real secret:

```bash
cp apps/web/.env.example apps/web/.env
openssl rand -base64 32     # paste into AUTH_SECRET
```

Then edit `apps/web/.env`:

```ini
DATABASE_URL="postgresql://postgres:<strong-password>@postgres:5439/edith_dev?schema=public"
AUTH_SECRET="<openssl output>"
ALLOW_PUBLIC_REGISTRATION="true"

CRM_ADAPTER="centracrm"
CRM_BASE_URL="https://dev-crm.thefoundrys.com/api/v1"
CRM_TENANT_ID="..."
CRM_DEFAULT_CATALOG_ID="..."
CRM_EMAIL="..."
CRM_PASSWORD="..."

PAYMENT_ADAPTER="razorpay"
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."
```

The host in `DATABASE_URL` is `postgres`, the Compose service name, on port
5439 — that is how the app container reaches the database. Use `localhost:5439`
only when connecting from the server's own shell. To point at an external
managed database instead, put its URL here and ignore the `postgres` service.

Now the Compose-level settings in the root `.env`:

```ini
APP_ORIGIN=https://edith.example.com
POSTGRES_PASSWORD=<same strong password as DATABASE_URL>
```

`APP_ORIGIN` becomes `AUTH_URL` / `NEXTAUTH_URL`. Get it wrong and Auth.js
builds login callbacks pointing at localhost, so sign-in breaks in the browser
while the container itself looks healthy. If you are serving plain HTTP on the
port with no domain yet, use `http://<server-ip>:3059`.

> `POSTGRES_PASSWORD` only takes effect the first time the database volume is
> created. Changing it later requires an `ALTER USER` inside the container (or
> deleting the `edith_pg` volume, which destroys the data).

## 5. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3059/tcp     # skip this if you terminate TLS with nginx (step 8)
sudo ufw enable
```

**Docker publishes ports through its own iptables chain, which ufw does not
filter.** Any service published on `0.0.0.0` is reachable from the internet even
when ufw says otherwise. That is why `postgres` is bound to `127.0.0.1:5439` in
`docker-compose.yml`. Do not change that to `0.0.0.0` to "make it reachable" —
use an SSH tunnel instead:

```bash
ssh -L 5439:127.0.0.1:5439 user@server   # then connect to localhost:5439 locally
```

## 6. First deploy

```bash
cd /srv/foundryxs
docker compose build          # a few minutes: npm ci + next build
docker compose up -d
docker compose run --rm prisma        # creates the schema (prisma db push)
docker compose run --rm --entrypoint npx prisma tsx prisma/seed.ts   # optional
```

The runtime image ships no Prisma CLI, so schema work goes through the one-shot
`prisma` service, which reuses the build stage and exits when done.

## 7. Verify

```bash
docker compose ps                       # both services should say (healthy)
curl -f http://localhost:3059/api/health
curl -o /dev/null -w '%{http_code}\n' http://localhost:3059/login
```

Expect `{"status":"ok",...}` and `200`. From your laptop, open
`http://<server-ip>:3059`. If the containers are healthy but the page is
unreachable, the cause is the firewall or the cloud provider's security group,
not the app.

## 8. TLS and a domain (recommended)

Point the app at loopback and put nginx in front of it. In the root `.env`:

```ini
APP_BIND=127.0.0.1
APP_ORIGIN=https://edith.example.com
```

Apply it with `docker compose up -d`, then close the raw port:
`sudo ufw delete allow 3059/tcp`.

```bash
sudo apt-get install -y nginx
sudo ufw allow 'Nginx Full'
```

`/etc/nginx/sites-available/edith`:

```nginx
server {
  listen 80;
  server_name edith.example.com;

  # Application documents allow up to 10 MB; nginx defaults to 1 MB.
  client_max_body_size 12M;

  location / {
    proxy_pass http://127.0.0.1:3059;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/edith /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d edith.example.com
```

Certbot rewrites the vhost for 443 and installs a renewal timer. The app trusts
the proxy headers because Compose sets `AUTH_TRUST_HOST=true`.

## 9. Updating a running deployment

```bash
cd /srv/foundryxs
git pull
docker compose build web
docker compose up -d
docker compose run --rm prisma        # only when the Prisma schema changed
```

`up -d` recreates only what changed. There is a short gap while the app
container restarts, roughly the container's boot time. Reclaim old layers
occasionally with `docker image prune -f`.

Restarts are automatic: both services use `restart: unless-stopped`, and with
`docker.service` enabled the stack comes back after a reboot. No systemd unit
of your own is needed.

## 10. Backups

Database, from the server (the bundled Postgres listens on 5439):

```bash
docker compose exec -T postgres pg_dump -p 5439 -U postgres edith_dev \
  | gzip > "/srv/backups/edith-$(date +%F).sql.gz"
```

Uploaded files live in the `edith_uploads` volume, not in the repo:

```bash
docker run --rm -v edith_edith_uploads:/data -v /srv/backups:/backup alpine \
  tar czf "/backup/uploads-$(date +%F).tar.gz" -C /data .
```

Add both to a cron entry and copy them off the box. Restore the database with
`gunzip -c dump.sql.gz | docker compose exec -T postgres psql -p 5439 -U postgres -d edith_dev`.

## 11. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `exit code 137` during build | Out of memory — add swap (step 1) |
| `web` never turns healthy | `docker compose logs web`; usually `DATABASE_URL` unreachable or `AUTH_SECRET` missing |
| Login redirects to `localhost` | `APP_ORIGIN` not set to the public URL |
| `P1001: Can't reach database server` | Host must be `postgres:5439` from inside the container, not `localhost` |
| 413 on a document upload | Raise `client_max_body_size` in nginx |
| Port 3059 already in use | Set `APP_PORT` in the root `.env` |

Useful commands:

```bash
docker compose logs -f web        # follow app logs
docker compose logs --tail 100 postgres
docker compose exec web sh        # shell in the app container (non-root)
docker compose exec postgres psql -p 5439 -U postgres -d edith_dev
docker compose down               # stop (add -v to also delete the volumes)
```

---

## Production checklist

- [ ] `AUTH_SECRET` generated with `openssl rand -base64 32`, not the example value
- [ ] `POSTGRES_PASSWORD` strong and matching `DATABASE_URL`
- [ ] `APP_ORIGIN` set to the real public URL
- [ ] `PAYMENT_ADAPTER=razorpay` with live keys, and `ALLOW_MOCK_PAYMENTS` unset
- [ ] `ALLOW_PUBLIC_REGISTRATION` reviewed for the launch plan
- [ ] Postgres still bound to `127.0.0.1`
- [ ] TLS terminated by nginx, raw 3059 closed in ufw
- [ ] Database and uploads backups scheduled and restore-tested
- [ ] `apps/web/.env` never committed (it is gitignored — keep it that way)
