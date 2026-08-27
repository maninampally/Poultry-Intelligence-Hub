# Murgi Mitra — Repository Plan

**Purpose:** Map the current TypeScript prototype to the production monorepo and migration sequence.  
**Companion docs:** [`MVP.md`](MVP.md) (product gate) · [`system_design.md`](system_design.md) (architecture) · [`docs/architecture.md`](docs/architecture.md) (current implemented path)

---

## 1. Decision

The existing repo is a useful **TypeScript web/API prototype**. The preferred system is an **offline-first mobile production architecture** with immutable events, controlled sync, rebuildable projections, RBAC/RLS, and background processing.

**Stack decision:** migrate deliberately to **FastAPI + Python `backend-core` + Celery**. Do not permanently run two competing business layers.

Temporary coexistence during migration is allowed:

```text
Express API  → legacy mutable log tables
FastAPI API  → event-ledger tables
```

Final state:

```text
FastAPI + backend-core  owns business logic
PostgreSQL              owns persistence
Mobile / web            consume generated API contracts
Celery                  owns asynchronous processing
```

---

## 2. Current repo (as-is)

```text
Poultry-Intelligence-Hub/
├── apps/
│   ├── web/          # Active React farmer/admin dashboard (Vite)
│   ├── api/          # Active Express REST API (route-owned logic)
│   ├── mobile/       # Expo scaffold — modules + sync primitives
│   └── worker/       # Stub
├── packages/
│   ├── db/           # SQL files + migrations (primary domain boundary today)
│   ├── api-spec/     # OpenAPI
│   ├── api-zod/      # Generated Zod
│   └── api-client-react/
├── scripts/          # Seed
├── deploy/           # Docker / nginx examples
├── docs/
│   └── architecture.md
├── system_design.md
├── MVP.md
└── REPO_PLAN.md
```

### What is already strong

- Monorepo + pnpm workspace discipline
- Mobile feature modules + `core/db`, `core/sync` (`SyncEngine`, `SyncOutbox`, `SyncCursor`)
- OpenAPI → generated clients
- Working web surface for demos and internal testing
- Baseline schema understanding in `packages/db`

### What must change

| Today | Problem |
|---|---|
| Express routes own business rules | Logic cannot be shared cleanly with workers |
| Mutable `*_logs` tables | Cannot support corrections, audit, or rebuilds properly |
| Calculations inside API handlers | Projections drift; hard to replay |
| `packages/db` as domain boundary | SQL package ≠ domain model |
| Worker stub | No outbox relay, alerts, or report pipeline |
| Web treated as farmer product | Pulls focus from offline mobile MVP |

---

## 3. Keep vs replace

### Keep

```text
apps/mobile/
  modules/
  core/db/
  core/sync/
  core/auth/
  navigation / Expo Router routes
  Expo / EAS setup

packages/
  api-spec/                    # evolve; keep contract-first habit
  TypeScript tooling / pnpm

apps/web/
  retain as internal admin / developer / portfolio demo
  do not treat as farmer V1
```

### Replace or refactor (over phases)

```text
apps/api/          Express routes + route-owned logic
apps/worker/       stub
packages/db/       as primary domain boundary (queries stay useful as reference)
```

### Add

```text
apps/api/                 # FastAPI entrypoint only (after cutover; may coexist as api-python first)
apps/worker/              # Celery entrypoint only
packages/backend-core/    # Shared Python domain / application / infrastructure
packages/contracts/       # Sync + event fixtures
packages/api-client/      # Generated TS client (evolve from api-client-react)
packages/ui/              # Shared RN primitives (optional, when needed)
packages/shared-config/
db/                       # Alembic migrations, seeds, RLS policies
infra/                    # docker, terraform, scripts
docs/adr/ · docs/runbooks/
tests/e2e/ · contract/ · load/
```

---

## 4. Target repository structure

```text
murgi-mitra/
│
├── apps/
│   ├── mobile/                         # React Native + Expo (farmer V1)
│   ├── web/                            # Internal/admin dashboard (not farmer V1)
│   ├── api/                            # FastAPI startup + route registration
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   └── dependencies.py
│   │   ├── pyproject.toml
│   │   └── Dockerfile
│   └── worker/                         # Celery startup + task discovery
│       ├── app/
│       │   ├── celery_app.py
│       │   └── bootstrap.py
│       ├── pyproject.toml
│       └── Dockerfile
│
├── packages/
│   ├── backend-core/
│   │   ├── pyproject.toml
│   │   └── src/murgi_mitra/
│   │       ├── core/                   # auth, db, events, outbox, idempotency, …
│   │       ├── contracts/              # api / events / sync schemas
│   │       ├── modules/                # identity, tenancy, farms, batches,
│   │       │                           # daily_ops, feed_inventory, health,
│   │       │                           # finance, performance, alerts, sync,
│   │       │                           # reporting, audit, intelligence(V2 empty)
│   │       └── workers/                # metrics, alerts, notifications, reports
│   ├── api-client/                     # Generated TypeScript client
│   ├── contracts/                      # JSON fixtures for contract tests
│   ├── ui/
│   └── shared-config/
│
├── db/
│   ├── migrations/                     # Alembic
│   ├── seeds/
│   ├── rls/
│   └── schema/
│
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── scripts/
│
├── docs/
│   ├── product/
│   ├── architecture/
│   ├── adr/
│   └── runbooks/
│
├── tests/
│   ├── e2e/
│   ├── contract/
│   └── load/
│
├── docker-compose.yml
├── Makefile
├── pnpm-workspace.yaml
├── turbo.json
├── pyproject.toml
└── README.md
```

### Module boundary rule (backend)

```text
API router
  → application service
    → domain rules
      → repository
        → PostgreSQL transaction
          → event ledger + outbox
```

- No business logic in routers
- No DB calls in domain rules
- No cross-module table writes

API and worker both import `murgi_mitra` from `packages/backend-core`.

---

## 5. Data architecture target

### Write path

```text
1. Validate permission + business rules
2. Insert immutable source event
3. Update immediate projection if required
4. Insert audit record
5. Insert outbox event
6. Commit
```

### Worker path

```text
1. Read unpublished outbox event
2. Enqueue deterministic idempotent task
3. Update metrics / alerts / notifications
4. Mark outbox published (or dead-letter)
```

### First ledger tables

```text
farm_events
sync_operations
sync_cursors
outbox_events
audit_log
mortality_events          # first operational event table
```

Do **not** delete legacy `mortality_logs` until the FastAPI path is proven.

### Schema boundaries (PostgreSQL)

| Schema | Contents |
|---|---|
| `auth` | users, sessions, devices |
| `app` | farm/batch source data + projections |
| `internal` | outbox, sync ops, audit, feature flags |
| `analytics` | exports / future AI features (V2) |

---

## 6. Migration sequence

Migrate **one vertical slice at a time**. Do not convert Express to FastAPI as a big-bang rewrite.

### Phase 0 — Freeze current behavior

- Keep Express running
- Document current endpoints and tables
- Database backups
- Baseline tests around batch / mortality / feed (even thin smoke tests)
- Export current OpenAPI as baseline contract
- Map any remaining responsibilities from deleted `domain` / `shared` / `sync` packages into mobile modules or future `backend-core`

### Phase 1 — Add Python skeleton (no deletions)

Add alongside existing code:

```text
apps/api-python/          # or apps/api once cutover naming is clear
apps/worker-python/
packages/backend-core/
db/migrations/            # Alembic owns new migrations
docs/adr/001-modular-monolith.md
docs/adr/002-offline-first.md
docs/adr/003-event-ledger.md
```

Exit criteria:

- FastAPI `/health`
- Celery connects to Redis
- Python connects to same Postgres
- ADR documents temporary Express coexistence

### Phase 2 — Introduce event ledger

Create ledger + sync + outbox tables. Add `mortality_events` without removing `mortality_logs`.

```text
Express mutation  → mortality_logs (legacy)
FastAPI command   → farm_events + mortality_events + outbox_events
```

### Phase 3 — Mortality end-to-end (primary gate)

```text
Mobile mortality form
  → local event + outbox
  → FastAPI /v1/sync/push
  → idempotency validation
  → farm_events + mortality_events + outbox_events
  → Celery metrics task
  → batch_metrics projection
  → sync pull
```

**Do not migrate feed/weight/finance until this gate passes.** See acceptance criteria in [`MVP.md`](MVP.md).

### Phase 4 — Feed and inventory

Replace mutable `feed_logs` as source of truth with:

```text
feed_products
feed_lots
feed_inventory_movements
feed_usage_events
```

Stock is calculated from the movement ledger.

### Phase 5 — Performance and finance

```text
weight_sample_events
expense_events
sale_events
batch_metrics   # with calculation_version, last_processed_event_id, status
```

### Phase 6 — Tenant isolation and RBAC

```text
tenants
tenant_memberships
farm_memberships
roles / permissions
support_access_grants
```

Enable RLS on **new** tables first; expand policies incrementally with tests per policy.

### Phase 7 — Retire Express

1. Point mobile traffic at FastAPI
2. Keep Express read-only briefly if needed
3. Move web dashboard reads to FastAPI / reporting views
4. Remove Express after parity tests
5. Retire unused TypeScript DB packages last

---

## 7. Web app policy

**Do not delete `apps/web`.**

Use it as:

- Internal administrator dashboard
- Developer test surface
- Portfolio / demo UI
- Future family-accountant or integrator portal (post-MVP)

V1 product split:

```text
Farmer product     → Android mobile
Developer / admin  → existing web
Public web         → landing page only
```

---

## 8. Documentation standards (grow into)

```text
docs/
├── product/           # PRD, RBAC matrix, NFRs
├── architecture/      # system-design, data-model, sync-protocol, threat-model
├── adr/               # decisions (modular monolith, offline-first, event ledger, …)
└── runbooks/          # sync failure, projection rebuild, restore, DLQ, incident
```

Immediate ADRs to write during Phase 1:

1. Modular monolith (not microservices)
2. Offline-first mobile
3. Event ledger as source of truth
4. Idempotent sync
5. Tenant isolation (RBAC + RLS)
6. Transactional outbox
7. OpenAPI contracts
8. AI as read-only consumer (V2)

---

## 9. Infra target (V1)

Start with:

- ECS Fargate (API + worker)
- RDS PostgreSQL
- ElastiCache Redis
- S3, ECR, ALB
- Secrets Manager
- CloudWatch + Sentry + OpenTelemetry
- FCM

Do **not** introduce Kubernetes, Kafka, Elasticsearch, or a separate AI platform in V1.

Current `deploy/` remains valid for local/dev until `infra/` replaces it.

---

## 10. Near-term execution checklist

| Priority | Action |
|---|---|
| Now | Treat [`MVP.md`](MVP.md) + this plan + [`system_design.md`](system_design.md) as source of truth for direction |
| Next | Phase 0: baseline OpenAPI export, backups, smoke tests |
| Next | Phase 1: scaffold `packages/backend-core`, FastAPI `/health`, Celery + Redis |
| Gate | Phase 3 mortality offline sync slice green |
| Later | Feed → finance → RBAC/RLS → Express retirement |

### Do not

- Rewrite the whole backend before the mortality gate
- Permanently split business logic across Express and FastAPI
- Let web dashboard features block mobile MVP
- Add AI / marketplace / IoT before projections and sync are solid
- Delete legacy tables before cutover tests pass

---

## 11. One-line repo plan

**Keep the monorepo, mobile scaffold, OpenAPI discipline, and web demo; incrementally replace the Express CRUD center with a shared Python event-ledger core — proven first by offline mortality sync.**
