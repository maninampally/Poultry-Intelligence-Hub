# Deployment

Self-hosted optional stack for **Poultry Intelligence Hub** (Murgi Mitra).

**Preferred DB for development:** [Supabase](https://supabase.com) — set `DATABASE_URL` in `.env` and skip the Compose `db` service.

## Local API + web against Supabase

```bash
cp .env.example .env
# Paste Supabase Postgres URI into DATABASE_URL

corepack pnpm install
corepack pnpm run db:migrate
corepack pnpm run seed
corepack pnpm run dev:api
corepack pnpm run dev:web
```

## Docker Compose (optional local Postgres)

From the **repository root**:

```bash
cp .env.example .env
# For Compose DB, set:
# DATABASE_URL=postgresql://murgi:changeme@localhost:5432/murgi_mitra

docker compose -f deploy/docker-compose.yml up -d db
corepack pnpm install
corepack pnpm run db:migrate
corepack pnpm run seed

docker compose -f deploy/docker-compose.yml up -d --build
```

Open `http://localhost` (or `HTTP_PORT`).

| Service | Role |
|---------|------|
| `db` | PostgreSQL 16 (optional if using Supabase) |
| `api` | Express API |
| `web` | nginx: SPA + `/api` proxy |

Health: `GET /api/healthz`

## Environment

See [`.env.example`](../.env.example). Required:

- `DATABASE_URL` (Supabase or local Postgres)
- `PORT` (API, default `8080`)

## Build images only

```bash
docker build -f deploy/Dockerfile.api -t murgi-mitra-api .
docker build -f deploy/Dockerfile.web -t murgi-mitra-web .
```

## Bare metal

1. Node 22+, pnpm, Postgres (or Supabase).
2. `.env` with `DATABASE_URL`.
3. `pnpm install && pnpm run db:migrate && pnpm run build`
4. API: `pnpm --filter @murgi-mitra/api start`
5. Serve `apps/web` build with nginx ([`nginx.conf`](./nginx.conf)).
