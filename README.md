# Poultry Intelligence Hub (Murgi Mitra)

A mobile-first operating companion for Indian broiler farmers. It turns farm
data into clear, actionable decisions: a farmer should understand the flock
situation within 5–10 seconds of opening the app.

This repository contains the **scaffold** for the backend, database, and
mobile frontend, built to the design documented in
[`AGENTS.md`](./AGENTS.md), [`docs/`](./docs), and the product-direction docs.

---

## Architecture

A modular monolith (see `docs/SYSTEM_DESIGN.md` and the Production Direction):

```
Expo React Native (SQLite, offline-first)
        │  HTTPS / JWT
        ▼
FastAPI (asyncpg, deterministic analytics)      Celery worker (Redis)
        │                                                │
        ▼                                                ▼
PostgreSQL (Supabase) — source of truth, Row-Level Security
```

- **Database** (`supabase/migrations/`): PostgreSQL schema with tenancy
  (org → farm → shed → flock), daily records and append-only event tables,
  lifting/settlement/finance, summaries, sync primitives, and an audit log.
  Row-Level Security on every table. Money is stored as **integer paise**.
- **Backend** (`apps/api/`): FastAPI with JWT auth, asyncpg pool that sets the
  RLS user per request, domain routers, and a **deterministic analytics
  engine** (FCR, mortality %, livability, settlement) with pytest tests.
- **Worker** (`apps/worker/`): Celery + Redis scaffold for projection rebuilds
  and alert evaluation.
- **Mobile** (`apps/mobile/`): Expo + TypeScript (strict) + Expo Router +
  NativeWind themed from the design tokens, i18n, a local SQLite data layer
  with a sync queue, and the base UI components.

---

## Repository layout

```
apps/
  api/        FastAPI backend + deterministic analytics engine (+ tests)
  worker/     Celery background worker (Redis)
  mobile/     Expo React Native app (offline-first)
supabase/
  migrations/ Ordered SQL migrations (0001..0008)
  test/       Auth stub + migration/RLS smoke tests
docs/         Data model, system design, sync protocol, FastAPI setup
design/       pih-design-tokens.json (design system source of truth)
docker-compose.yml   Local dev: postgres, redis, api, worker, migrate
```

---

## Quick start (local)

Prerequisites: Docker, Node 20 (for mobile), Python 3.12 (for API tests).

### 1. Bring up the backend stack

```bash
cp .env.example .env
docker compose up --build        # postgres, redis, api, worker
docker compose run --rm migrate  # apply migrations to postgres
```

- API: http://localhost:8000  ·  Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 2. Run the backend tests (deterministic analytics)

```bash
cd apps/api
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```

### 3. Verify the database migrations + RLS (no app needed)

```bash
bash supabase/test/run_rls_test.sh
```

This spins up a throwaway Postgres, applies all migrations, and proves tenant
isolation and the worker finance-access block.

### 4. Run the mobile app

```bash
cd apps/mobile
npm install
npm run typecheck     # tsc --noEmit
npm start             # Expo; open on Android (Expo Go or a dev build)
```

Open the **Component preview** screen to see every base component state.

---

## Design rules (enforced)

From `AGENTS.md` — the non-negotiables the code follows:

1. No hard-coded colors/sizes/fonts — theme tokens only.
2. No hard-coded user-facing text — everything through i18n (`t('key')`).
3. Layouts wrap; important labels are never truncated.
4. Touch targets ≥ 48px; primary actions ≥ 56px.
5. Status is never color alone — always icon + word (Normal / Watch / Act).
6. Offline-first — writes hit local SQLite + a sync queue in one transaction.
7. Money stored as integer **paise**, formatted (Indian grouping) only for display.
8. Calculations are deterministic code; the LLM only explains results.

---

## Status

This is a **foundation scaffold** (BUILD_GUIDE phases 1–3 plus the analytics
and settlement engine). Not yet built: the full sync engine, AI assistant,
push notifications, and the remaining record/finance screens. See
`BUILD_GUIDE_END_TO_END.md` for the phased plan.

Breed targets, alert thresholds, and real contract settlement formulas are
intentionally **placeholders** marked in code — they come from `DECISIONS.md`
(BUILD_GUIDE Phase 0) which the farm owner/vet supplies.
