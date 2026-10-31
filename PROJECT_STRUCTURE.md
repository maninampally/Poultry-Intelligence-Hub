# Poultry Intelligence Hub — Project Structure Guide

> **Canonical folder:** `/home/mani/projects/Poultry-Intelligence-Hub` (Ubuntu/WSL)  
> Desktop copy is deprecated — do not develop there.

**Product:** Poultry Intelligence Hub — offline-first broiler farm OS (India-first).  
**Money:** integer **paise**.  
**GitHub:** https://github.com/maninampally/Poultry-Intelligence-Hub

---

## Layout (segregated monorepo)

```
Poultry-Intelligence-Hub/
├── apps/
│   ├── web/                 # Vite React web UI (source of truth for browser UI)
│   ├── api/                 # FastAPI + analytics
│   ├── mobile/              # Expo React Native
│   └── worker/              # Celery + Redis
├── supabase/
│   ├── migrations/          # Postgres schema + RLS (0001–0008)
│   └── test/                # RLS / migration smoke tests
├── design/                  # Design tokens (pih-design-tokens.json)
├── docs/                    # Architecture & engineering docs
│   └── archive/             # Zips / historical bundles
├── docker-compose.yml       # Local postgres, redis, api, worker, migrate
├── package.json             # Root convenience scripts → apps/web
├── .env.example
├── AGENTS.md
├── README.md
├── QUICKSTART.md
└── PROJECT_STRUCTURE.md     # This file
```

### What lives where

| Concern | Path |
|---------|------|
| Web UI (pages, charts, theme, localStorage demo) | `apps/web/src/` |
| Web deploy (Vercel) | `apps/web/` + Root Directory `apps/web` |
| HTTP API | `apps/api/app/` |
| Background jobs | `apps/worker/` |
| Mobile app | `apps/mobile/` |
| Database schema | `supabase/migrations/` |
| Design tokens | `design/pih-design-tokens.json` |
| Long-form architecture | `docs/poultry-intelligence-advanced-system-architecture-v1.1.md` |

---

## Apps detail

### `apps/web` — browser UI

- React 19 + Vite + Tailwind 4 + shadcn
- Routes: landing `/`, login, protected dashboard shell
- State: `src/store/farm-store.tsx` + `localStorage` demo (not wired to API yet)
- Domain: `src/domain/` (calc, finance, metrics, breed-standard, …)
- Charts / color stats: `src/components/farm/`

```bash
cd apps/web && npm install && npm run dev
# or from repo root:
npm run dev
```

### `apps/api` — FastAPI

- asyncpg + JWT + RLS session GUC
- Routers under `app/routers/`
- Analytics under `app/analytics/`
- Swagger: http://localhost:8000/docs

### `apps/mobile` — Expo

- Expo Router, NativeWind, i18n, SQLite (scaffold)
- Theme: `apps/mobile/tailwind.config.js` (mirrors design tokens)

### `apps/worker` — Celery

- Redis broker; scaffold tasks (metrics rebuild, alerts)

### `supabase/` — database

Authoritative SQL migrations `0001`–`0008` (tenancy → flocks/records → finance → AI/sync → RLS).

---

## Mental model

```
apps/mobile  ─┐
apps/web     ─┼──► apps/api ──► Postgres (supabase/migrations) + RLS
              └──► apps/worker ◄── Redis
```

---

## Run book (short)

```bash
# Backend
cp .env.example .env
docker compose up --build
docker compose run --rm migrate

# Web UI
npm run dev                 # apps/web

# Mobile
cd apps/mobile && npm install && npm start
```

---

## Known gaps

- Web UI not yet calling FastAPI (localStorage demo).
- Sync engine / mobile farm screens / AI still incomplete.
- Prefer this WSL tree as the only working copy.

---

*Updated after monorepo segregation: web moved to `apps/web/`.*
