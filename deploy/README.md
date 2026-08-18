# Deployment

Self-hosted setup for **Poultry Intelligence Hub** (Murgi Mitra).

## Quick start (Docker Compose)

From the **repository root**:

```bash
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD at minimum

docker compose -f deploy/docker-compose.yml up -d db
pnpm install
pnpm run db:push          # applies schema (DATABASE_URL → localhost:5432)
pnpm run seed             # optional demo data

docker compose -f deploy/docker-compose.yml up -d --build
```

Open `http://localhost` (or the port set in `HTTP_PORT`).

Services:

| Service | Role |
|---------|------|
| `db` | PostgreSQL 16 |
| `api` | Express API on internal port 8080 |
| `web` | nginx: static SPA + `/api` proxy |

Health check: `GET /api/healthz`

## Environment variables

See [`.env.example`](../.env.example). Minimum for production:

- `DATABASE_URL`
- `PORT` (API, default `8080`)
- `POSTGRES_*` (when using Compose)

## Build images only

```bash
docker build -f deploy/Dockerfile.api -t murgi-mitra-api .
docker build -f deploy/Dockerfile.web -t murgi-mitra-web .
```

## Bare metal (no Docker)

1. Install Node 22+, pnpm, PostgreSQL 16.
2. Copy `.env.example` → `.env` and set `DATABASE_URL`.
3. `pnpm install && pnpm run build`
4. Run API: `pnpm --filter @murgi-mitra/api start`
5. Build web: `pnpm --filter @murgi-mitra/web build`
6. Serve `apps/web/dist/public` with nginx using [`nginx.conf`](./nginx.conf) — point `proxy_pass` to `http://127.0.0.1:8080`.

Optional: [`systemd/murgi-mitra-api.service.example`](./systemd/murgi-mitra-api.service.example)

## TLS / custom domain

Put Caddy or nginx in front of the `web` container (or terminate TLS on your host) and forward to port 80. No app changes required — the API client uses relative `/api` paths.
