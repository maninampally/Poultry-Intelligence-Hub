# Murgi Mitra (Poultry Intelligence Hub)

Single product repo for broiler farm operations in India.

## Layout

| Path | Role |
|------|------|
| `apps/web` | Frontend — React + Vite + TypeScript (FarmApp from Murgi) |
| `apps/api-python` | Backend — FastAPI (sync, metrics) |
| `packages/backend-core` | Shared Python domain (mortality, sync) |
| `db/migrations` | Postgres schema |
| `apps/mobile` | Expo app (parked; same FastAPI later) |
| `apps/api` | Legacy Express — not the product API |

**Canonical stack:** TypeScript/React frontend + Python/FastAPI backend + Postgres.

The old standalone `murgi-mitra-site` repo is retired; develop only here.

## Quick start (frontend)

```bash
corepack pnpm install
corepack pnpm --filter @murgi-mitra/web dev
# http://127.0.0.1:5173
```

Local demo auth uses browser storage (no API required).

## Backend (FastAPI)

```bash
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET

corepack pnpm run db:migrate
pip install -e packages/backend-core
pip install -e apps/api-python

cd apps/api-python
python -m uvicorn app.main:app --reload --port 8000
```

Design notes: [`docs/DESIGN.md`](docs/DESIGN.md)
