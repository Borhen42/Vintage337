# Deploy Vintage337 (VPS + Docker)

Step-by-step deployment: **Postgres + Spring Boot** on a VPS with Docker, **HTTPS** via a reverse proxy, **Angular** built with your public API URL, and optional **Vercel** for the static frontend.

## 1. Prerequisites on the VPS

### Install Docker (Debian/Ubuntu example)

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in so the `docker` group applies. Verify: `docker compose version`

### Firewall (UFW example)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### DNS (recommended)

Point `api.yourdomain.com` (A record) to your VPS public IP.

## 2. Get the project on the server

```bash
git clone <your-repo-url> vintage337
cd vintage337
```

## 3. Environment file

```bash
cp env.prod.example .env
```

Edit `.env`.

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PASSWORD` | Defaults to `postgres` in `env.prod.example` (matches local `docker-compose.yml`); set a strong value in production |
| `JWT_SECRET` | Long random string (32+ chars) |
| `APP_PUBLIC_URL` | Public API base URL, no trailing slash (e.g. `https://api.yourdomain.com`) |
| `APP_FRONTEND_URL` | SPA URL (e.g. `https://your-app.vercel.app`) |
| `APP_CORS_ALLOWED_ORIGINS` | Comma-separated; must include the SPA origin |

After HTTPS is configured, use `https://` URLs in `APP_PUBLIC_URL` and CORS.

## 4. Start API + database

From the repository root:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

Smoke test:

```bash
curl -sS http://127.0.0.1:8080/api/health
```

## 5. HTTPS (Caddy or nginx)

Put TLS in front of the container.

### Option A: Caddy

1. Install [Caddy](https://caddyserver.com/docs/install) on the host.
2. Copy [deploy/caddy/Caddyfile.example](deploy/caddy/Caddyfile.example) to `/etc/caddy/Caddyfile`, replace `api.example.com`, ensure `reverse_proxy` targets `127.0.0.1:8080`.
3. `sudo systemctl reload caddy`
4. Update `.env` with `https://` URLs, then `docker compose -f docker-compose.prod.yml --env-file .env up -d`

### Option B: nginx

Use [deploy/nginx/vintage337-api.conf.example](deploy/nginx/vintage337-api.conf.example) as a site template (pair with certbot for Let’s Encrypt).

## 6. Build the Angular app

### Option A: Edit environment.prod.ts

Set `apiBaseUrl` in [frontend/src/environments/environment.prod.ts](frontend/src/environments/environment.prod.ts), then:

```bash
cd frontend
npm ci
npm run build
```

### Option B: Environment variable (CI / Vercel)

Set `VINTAGE337_API_BASE_URL` to your API origin, then:

```bash
cd frontend
npm ci
npm run build:deploy
```

## 7. Deploy frontend on Vercel

- **Root Directory:** `frontend`
- **Install Command:** `npm ci`
- **Build Command:** `npm run build:deploy`
- **Output Directory:** `dist/vintage337-frontend/browser`

Add Vercel environment variable `VINTAGE337_API_BASE_URL` = your public API URL (no trailing slash).

## 8. Final checks

- CORS errors: update `APP_CORS_ALLOWED_ORIGINS` and restart the `api` container.
- Broken `/uploads/**`: confirm `apiBaseUrl` / `VINTAGE337_API_BASE_URL` and `APP_PUBLIC_URL`.

## Optional: managed Postgres

Point the API at Supabase/Neon via `SPRING_DATASOURCE_*`. See [database/supabase-notes.txt](database/supabase-notes.txt).

## Deploy on Render instead of a VPS

See [DEPLOY-RENDER.md](DEPLOY-RENDER.md) for a Render + Supabase deployment guide.
