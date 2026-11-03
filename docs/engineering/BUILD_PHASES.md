# Build phases — path to a trustworthy offline farm OS

> **Branch for Phase 0 work:** `feat/build-phases-p0-foundation`  
> **As-built today:** schema + RLS SQL tests + thin FastAPI CRUD + deterministic analytics unit tests.  
> **Not built yet:** sync apply path, Celery projections, CI, event ledger from `SYSTEM_DESIGN.md`.

This plan is ordered for **shortest path to correct product behavior**. Do not jump to scale (100k farmers, event-ledger rewrite) until Phases 0–2 work on the current tables.

---

## Reality check (baseline)

| Capability | Status |
|------------|--------|
| Migrations `0001–0008`, RLS helpers/policies, SQL RLS smoke test | Done |
| FastAPI CRUD (auth bootstrap, farms, flocks, daily records, lifting) | Thin / done |
| Analytics pure Python + unit tests | Done |
| Analytics HTTP (`GET .../metrics`) | Partial (data-source gaps) |
| Sync push/pull | Scaffold (log + delta SELECT; **no domain apply**) |
| Celery worker | Noop scaffold |
| Mobile/web → API | Not wired |
| GitHub Actions CI | Missing (started in Phase 0) |
| `farm_events` ledger in SYSTEM_DESIGN | Target architecture only — **not in schema** |

---

## Phase 0 — Correctness & security foundation *(this branch)*

**Goal:** Make the local/prod story honest: RLS actually applies under the API role, JWT cannot fail open outside local, metrics read the same facts farmers enter, and CI catches regressions.

| # | Work item | Done when |
|---|-----------|-----------|
| 0.1 | Non-bypass DB role `pih_app` for API/worker | Compose/prod use `pih_app`; RLS tests still pass |
| 0.2 | JWT fail-closed outside `local`/`dev`/`test` | App refuses to start (or rejects auth) without `JWT_SECRET` |
| 0.3 | Align `app_flock_mortality` / `app_flock_feed_kg` with `daily_records` | Daily round deaths/feed affect metrics |
| 0.4 | Fix livability semantics on analytics endpoint | Uses birds sold (lifting), not live birds; else `null` |
| 0.5 | Minimal CI | `pytest` + RLS script + web build on PR |

**Out of scope for Phase 0:** full sync apply, mobile wiring, settlement API, event ledger.

---

## Phase 1 — Offline sync loop

**Goal:** A daily record saved on device becomes durable server state without double-writing via ad-hoc CRUD only.

**Branch:** `feat/phase-1-sync-loop` (from Phase 0)

| # | Work item | Done when | Status |
|---|-----------|-----------|--------|
| 1.1 | Sync push **applies** whitelisted ops (`daily_records`, `mortality_records`) | Push mutates domain tables + logs `sync_operations` | Done in branch |
| 1.2 | Require `device_id` on push; migration `0010` NOT NULL | Duplicate retries stay safe; failed keys can retry | Done in branch |
| 1.3 | Mobile `drainSyncQueue` / `registerSyncDevice` → `POST /api/v1/sync/push` | Queue drains; `sync_status` → synced/failed | Done in branch (call from UI/session next) |
| 1.4 | Pull: keyset `(updated_at, id)`, tombstones, `sync_cursors` | Multi-device catch-up without skips/dups | Done in branch |

**Follow-up (still open):** hook `drainSyncQueue` into app session/UI; persist `deviceId` in secure storage; apply path for remaining event tables (`feed_records`, …).

---

## Phase 2 — Projections & shared analytics

**Goal:** Live metrics are rebuildable and shared; API and worker use one engine.

| # | Work item | Done when |
|---|-----------|-----------|
| 2.1 | Shared Python package (or path) for `apps/api` analytics used by worker | No duplicated formulas |
| 2.2 | Implement `rebuild_flock_metrics` → upsert `flock_metrics` | Worker no longer `noop-scaffold` |
| 2.3 | Enqueue rebuild from domain writes / sync apply | Projections update after sync |
| 2.4 | Chick / breed weight from config or breed table | Remove hard-coded `0.045` in analytics router |
| 2.5 | Implement `evaluate_alerts` for mortality/feed runway rules | Notifications rows with reason + action |

---

## Phase 3 — Finance & product APIs

**Goal:** Manager-facing money flows use integer paise and existing settlement engine.

| # | Work item | Done when |
|---|-----------|-----------|
| 3.1 | Settlement + expenses HTTP APIs (manager-only via RLS) | Persist `compute_settlement` into `settlements` / lines |
| 3.2 | Integration tests: worker denied finance; manager allowed | TestClient + `pih_app` / RLS role |
| 3.3 | Optional: use `app_can_access_flock` in RLS for shed-scoped workers | Or document and drop unused helper |
| 3.4 | Wire web farm screens to FastAPI **or** mark web as demo-only in README | No silent dual sources of truth |

---

## Phase 4 — Hardening & doc truth

**Goal:** Process speed and trust: docs match code; scale work is intentional.

| # | Work item | Done when |
|---|-----------|-----------|
| 4.1 | Rewrite/archive stale sections in `IMPLEMENTATION_SUMMARY`, `FASTAPI_SETUP`, `SYNC_PROTOCOL` | Clear **as-built** vs **target** labels |
| 4.2 | Response models (UUID→str), structured logging, liveness vs readiness | Clients don’t break on raw `dict(row)` |
| 4.3 | Rate limiting, CORS lockdown for non-local | Staging checklist green |
| 4.4 | Revisit event-ledger (`farm_events`) **only if** Phase 1–2 prove row-sync insufficient | Migration plan + dual-write strategy |

---

## Explicit non-goals (until Phase 2+ is green)

- 100k-farmer / 2k req/s load claims without load tests  
- Read replicas, S3 PDFs, full AI assistant  
- Rebase/rewrite of already-merged PR history on `main`  
- Building the SYSTEM_DESIGN event ledger before sync apply works  

---

## Suggested sequencing on the calendar

```
Week 1–2   Phase 0  (this branch → PR)
Week 3–5   Phase 1  (sync apply + mobile push)
Week 6–8   Phase 2  (projections + alerts)
Week 9–10  Phase 3  (finance APIs + web decision)
Ongoing    Phase 4  (docs/CI hardening)
```

---

## How to verify Phase 0

```bash
# Analytics unit tests
cd apps/api && python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt && pytest -q

# RLS (needs Docker)
bash supabase/test/run_rls_test.sh

# Stack with pih_app
cp .env.example .env
docker compose up --build
docker compose run --rm migrate
curl -s http://localhost:8000/health
```

See also: [`../architecture/SYSTEM_DESIGN.md`](../architecture/SYSTEM_DESIGN.md) (target), [`FASTAPI_SETUP.md`](./FASTAPI_SETUP.md), [`../ai/README.md`](../ai/README.md).
