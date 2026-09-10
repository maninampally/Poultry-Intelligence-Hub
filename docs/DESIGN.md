# Murgi Mitra — Design Guide

Single source of truth for **what to build**, **how the system works**, and **how the repo migrates**.  
For how to run locally, see [`README.md`](../README.md).

---

## 1. Product (MVP)

**V1:** Offline-first Android farmer app. Web is admin/demo only — not the farmer product.

**Active engineering focus:** mortality offline → sync → projection only.  
Feed / weight / finance sync handlers may exist but are **frozen** until the mortality gate passes. Do not expand them.

### Principles

1. Offline is normal — write locally first; sync is background.
2. Farm facts are immutable events; corrections are compensating events.
3. Projections are rebuildable from the event ledger.
4. AI is downstream only (post-MVP); never mutates source farm data.
5. Security is double-enforced — app RBAC + PostgreSQL RLS.

### Definition of done

> A farmer can log mortality offline, reconnect, sync without duplicates, see a correct live-bird count, apply a correction without erasing history, and remain isolated from other tenants.

### Acceptance (mortality slice)

- [ ] Airplane-mode log updates local UI immediately
- [ ] Reconnect push uses idempotency keys
- [ ] Retry → exactly one server event
- [ ] `batch_metrics` shows live birds + cumulative mortality
- [ ] Correction preserves original event (`supersedes_event_id`)
- [ ] Pull updates a second device
- [ ] Cross-tenant access denied (auth + RLS)
- [ ] Projection rebuildable from ledger

### How to prove (mortality gate)

Local stack (no full AWS staging required):

1. Apply migrations `001`–`007` against Postgres (`DATABASE_URL`).
2. Seed a tenant, farm membership, batch, and shed for a pilot JWT user.
3. Start FastAPI (`apps/api-python`), Redis, and Celery (`apps/worker-python` — `outbox.relay` + metrics).
4. On mobile: `openLocalDatabase()` then log mortality offline; confirm pending row in durable outbox (AsyncStorage).
5. Force-quit and reopen the app — pending outbox items must still be present.
6. Reconnect and `SyncEngine.syncNow('push')` — FastAPI accepts once; retry with same `idempotency_key` returns `duplicate=true`.
7. Call `MortalityService.correct({ originalEventId, ... })` — new event carries `supersedes_event_id`; original row unchanged; rebuild metrics ignores the superseded count.
8. `pytest tests/contract -q` (install `tests/contract/requirements.txt` + editable `backend-core`).
9. Express `POST /batches/:batchId/mortality` returns **410** (`EXPRESS_MORTALITY_WRITE_FROZEN`); farmer writes go only through FastAPI `/v1/sync/push`. GET mortality routes on Express may remain for the web dashboard during dual-stack.

**Express mortality POST is frozen.** Do not re-enable farmer writes on Express.

### In scope

Identity (OTP/JWT) · tenancy/farm/shed · batches · mortality · feed movements · weight · expenses/sales · light vaccination · sync · metrics/alerts · closeout PDF · observability

### Out of scope (until gate passes)

AI advice · marketplace/lending · WhatsApp · IoT · layer poultry · full language expansion · integrator control plane · Kubernetes/Kafka/Elasticsearch · web as farmer V1

### Build order

1. Identity, tenant, farm, shed, RBAC  
2. Batch lifecycle  
3. Mobile local events + outbox  
4. **Mortality sync** ← primary gate  
5. Live-bird projection  
6. Feed inventory ledger  
7. Weight, finance, closeout  
8. Outbox → alerts → FCM  
9. PDF, audit, backup drill  
10. Pilot farms — then voice/AI/marketplace

---

## 2. System architecture

```text
Farmer Android app
  └─ Local SQLite
       ├─ Domain / event records
       ├─ Sync outbox + cursor
       └─ Local projections
             │ HTTPS + JWT + idempotency
             ▼
        FastAPI modular monolith
          auth · tenancy · farms · batches · daily_ops
          feed · finance · sync · alerts · reporting
             │
             ▼
        PostgreSQL
          farm_events · domain events · projections
          sync_operations · outbox · audit · RLS
             │
             ▼
        Celery + Redis → metrics / alerts / FCM / PDF / DLQ
```

### Dual path today

| Path | Stack | Role |
|---|---|---|
| Web demo | Express `apps/api` + `apps/web` | Legacy dashboard |
| Farmer target | FastAPI `apps/api-python` + `backend-core` + mobile | Event ledger + sync |

### Data rules

| Kind | Examples | Mutability |
|---|---|---|
| Source events | `mortality_events`, feed/sale events | Append-only |
| Reference | tenants, farms, sheds, batches | Controlled updates |
| Projections | `batch_metrics`, feed stock, alerts | Rebuildable |
| Sync | outbox, sync_operations, cursors | Operational |

### Write path (one DB transaction)

```text
1. Validate permission + rules
2. Insert immutable source event
3. Update projection if needed
4. Insert audit + outbox
5. Commit → worker publishes outbox → metrics/alerts
```

### Sync contracts

- `eventId` = permanent farm fact  
- `operationId` = one sync delivery  
- `idempotencyKey` = safe retries  
- Never trust client `tenantId` / `actorUserId` — derive from JWT  

### Target layout (summary)

```text
apps/mobile | api-python | worker-python | web (admin)
packages/backend-core | api-client | contracts | ui | shared-config
db/migrations | infra/ | docs/ | tests/
```

API and worker both import `murgi_mitra` from `backend-core`.  
Routers stay thin: router → application service → domain → repository → DB + outbox.

**Implemented reference module:** `packages/backend-core/.../modules/daily_ops/`  
(mortality only — `domain` / `application` / `infrastructure`).  
`modules/sync` is the HTTP adapter; feed/finance handlers there are frozen.

### Infra (V1)

ECS Fargate · RDS Postgres · Redis · S3 · ALB · Secrets Manager · CloudWatch · FCM  
No Kubernetes / Kafka / Elasticsearch / separate AI platform in V1.

---

## 3. Migration plan

**Decision:** Migrate to FastAPI + `backend-core` + Celery. Temporary Express coexistence OK; permanent dual business layers not OK.

### Keep

- `apps/mobile` modules + `core/db` + `core/sync`
- OpenAPI/codegen habit
- `apps/web` as admin/demo

### Replace over time

- Express route-owned logic
- Mutable `*_logs` as source of truth
- `packages/db` as domain boundary
- TS worker stub

### Phases

| Phase | Goal |
|---|---|
| 0 | Freeze Express farmer mortality writes (410 → FastAPI sync); baseline OpenAPI; backups; smoke tests |
| 1 | Python skeleton (`api-python`, `worker-python`, `backend-core`) |
| 2 | Event ledger tables; keep legacy logs |
| 3 | **Mortality end-to-end** (MVP gate) — durable mobile outbox/cursor, correction, contract tests |
| 4 | Feed inventory movements |
| 5 | Weight / finance projections |
| 6 | Tenants, RBAC, RLS |
| 7 | Mobile on FastAPI; Express read-only then retire |

### Cutover checklist (Phase 7)

- [ ] `DATABASE_URL` set; migrations `001`–`007` applied
- [ ] Tenant + farm memberships for pilot users
- [ ] Mortality / feed / weight / expense / sale parity
- [ ] Duplicate, correction, pull, cross-tenant tests green
- [ ] Web reads moved or still on Express intentionally
- [ ] Express read-only one validation window
- [ ] Remove Express only after parity passes

Do not delete `apps/api` or `packages/db` before parity and rollback checks.

---

## 4. Copilot / coding sessions

Paste this when generating code:

```text
@docs/DESIGN.md @README.md

Project: Murgi Mitra
Phase: [0–7]
Task: [one sentence]
Files: [paths]
Acceptance: [done when…]
Out of scope: AI, marketplace, web-as-farmer-V1, unrelated refactors

Rules:
- Immutable events; corrections are new events
- Offline-first mobile is farmer V1
- FastAPI + backend-core owns new business logic
- Idempotent sync (operationId + idempotencyKey)
- No business logic in routers
```

**Phase 3 example:** implement FastAPI sync push for `mortality-entry` → one transaction (`farm_events` + `mortality_events` + audit + outbox) → match mobile outbox types → retries must not duplicate.

---

## 5. One-line summary

**Ship offline mortality → idempotent sync → correct live-bird projection on Android against a Python event-ledger backend; grow every other feature on that spine.**
