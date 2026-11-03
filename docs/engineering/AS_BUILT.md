# As-built reference (truth over aspiration)

> Updated in **Phase 4**. Prefer this page and [`BUILD_PHASES.md`](./BUILD_PHASES.md)
> over older engineering summaries that describe Express / `farm_events` / batches.

## Stack that exists in the repo

| Layer | Path | Notes |
|-------|------|-------|
| API | `apps/api/` | FastAPI + asyncpg + JWT; DB role `pih_app` (no BYPASSRLS) |
| Shared analytics | `packages/pih_analytics/` | Deterministic FCR/mortality/settlement (paise) |
| Worker | `apps/worker/` | Celery: `pih.rebuild_flock_metrics`, `pih.evaluate_alerts` |
| DB | `supabase/migrations/0001`–`0011` | Flocks/daily records + sync + projections helpers |
| Mobile | `apps/mobile/` | SQLite + `sync_queue`; drain via `src/lib/sync` |
| Web | `apps/web/` | **Demo / marketing** — localStorage, not API-backed |
| CI | `.github/workflows/ci.yml` | pytest, RLS script, web build |

## HTTP surface (as-built)

- Auth: `/api/v1/auth/bootstrap`, `/me`
- Farms / flocks / daily records / lifting
- Sync: `/api/v1/sync/register-device`, `/push` (applies daily + mortality), `/pull` (keyset)
- Analytics: `/api/v1/analytics/flocks/{id}/metrics`
- Finance: `/api/v1/settlements/*`, `/api/v1/expenses`
- Health: `/health/live`, `/health/ready` (and `/health` → ready)

## What is *target* (not shipped)

- Immutable `farm_events` ledger from `SYSTEM_DESIGN.md`
- Express / `server/routes` / `batches` APIs described in archived summaries
- Web ↔ FastAPI wiring
- Full feed/water/medicine sync apply (only daily + mortality apply today)

Archived stale write-up: [`../archive/IMPLEMENTATION_SUMMARY.stale.md`](../archive/IMPLEMENTATION_SUMMARY.stale.md).
