# Poultry Intelligence Hub

**Murgi Mitra** — broiler farm management for Indian poultry operations.

Design & migration: [`docs/DESIGN.md`](docs/DESIGN.md)

## What to run today

| Surface | Path | Status |
|---|---|---|
| Web dashboard (demo/admin) | `apps/web` + Express `apps/api` | **Runnable** |
| Farmer mobile | `apps/mobile` → FastAPI `apps/api-python` | In progress |
| Background jobs | `apps/worker-python` (Celery) | Scaffolded |

## Quick start (web)

```bash
cp .env.example .env
# Set DATABASE_URL (Supabase Postgres URI)

corepack pnpm install
corepack pnpm run db:migrate   # 001–007 via schema_migrations
corepack pnpm run seed
corepack pnpm run dev:api      # http://127.0.0.1:8080
corepack pnpm run dev:web      # http://127.0.0.1:5173
```

## Repo layout

```
apps/
  web/            React dashboard (admin/demo)
  api/            Express REST (legacy until FastAPI parity)
  api-python/     FastAPI entrypoint (sync + health)
  mobile/         Expo farmer app (offline sync → FastAPI)
  worker/         Legacy TS stub
  worker-python/  Celery entrypoint
packages/
  db/             SQL queries + migrate runner
  backend-core/   Shared Python domain
  api-spec/       OpenAPI + Orval
  api-zod/        Generated Zod
  api-client-react/
db/migrations/    Event ledger, tenancy, feed, finance, RLS (002–007)
docs/DESIGN.md    Product + architecture + migration (single guide)
deploy/           Docker / nginx examples
```

## Env essentials

See [`.env.example`](.env.example):

- `DATABASE_URL` — required
- `JWT_SECRET` — required for FastAPI
- `CELERY_BROKER_URL` — Redis for workers
- `EXPO_PUBLIC_API_URL` — mobile → FastAPI (default `http://127.0.0.1:8000`)
- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` — mobile auth

## FastAPI (optional)

```bash
pip install -e packages/backend-core
pip install -e apps/api-python
pip install -e apps/worker-python

cd apps/api-python
python -m uvicorn app.main:app --reload --port 8000
```

Cutover gates live in [`docs/DESIGN.md`](docs/DESIGN.md) §3.
