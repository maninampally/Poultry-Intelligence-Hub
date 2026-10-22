# Poultry Intelligence — System Design at Scale

> Designed for 100,000+ concurrent farmers across India.  
> Offline-first. Event-driven. Multi-tenant. Auditable.

---

## 1. What we are building

A farm operating system for Indian broiler farmers: daily mortality, feed, weight, biosecurity, dispatch, and closeout — available offline on cheap Android phones, syncing to cloud when connected.

**Scale target:**
- 100,000 active farmers (concurrent peak: ~20,000 morning rounds)
- 500,000+ batches per year
- 10M+ daily farm events per day at peak
- Sub-second local writes, sub-5s cloud sync

---

## 2. Core principles

1. **Offline is the default** — every write succeeds locally first; cloud sync is background.
2. **Facts are immutable** — farm events are never edited; corrections are new events with `supersedes_event_id`.
3. **Projections are derived** — live birds, FCR, feed runway are computed from the event ledger, always rebuildable.
4. **Tenants are isolated** — every row belongs to an org; Postgres RLS enforces this at DB level, independent of app code.
5. **Idempotency everywhere** — every sync push carries a unique key; retries are safe.
6. **AI is downstream only** — intelligence reads projections, never mutates source data.
7. **India-first constraints** — 2G/3G connectivity, low-RAM Android, ₹ currency, regional languages.

---

## 3. High-level architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                               │
│                                                                  │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │  React Web App  │      │  Expo Mobile App│                   │
│  │  (PWA / Netlify)│      │  (Android/iOS)  │                   │
│  │                 │      │                 │                   │
│  │  localStorage   │      │  SQLite (local) │                   │
│  │  outbox         │      │  outbox         │                   │
│  └────────┬────────┘      └────────┬────────┘                   │
└───────────┼──────────────────────┬─┘────────────────────────────┘
            │ HTTPS / JWT          │
            ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                        API TIER  (Render / AWS ECS)              │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐           │
│  │              FastAPI  (Python)                   │           │
│  │                                                  │           │
│  │  /v1/sync/push  — validate + write event ledger  │           │
│  │  /v1/sync/pull  — cursor-based delta pull        │           │
│  │  /v1/batches    — batch lifecycle CRUD           │           │
│  │  /v1/farms      — farm/shed management           │           │
│  │  /v1/auth       — JWT issue / refresh            │           │
│  │  /health        — health check                   │           │
│  └───────────────────────┬──────────────────────────┘           │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────┐           │
│  │             Worker  (Celery + Redis)              │           │
│  │                                                  │           │
│  │  outbox.relay     — apply outbox → projections   │           │
│  │  metrics.rebuild  — batch_metrics (live birds)   │           │
│  │  alerts.evaluate  — rule engine (mortality spike)│           │
│  │  reports.generate — PDF closeout, FCR report     │           │
│  └───────────────────────┬──────────────────────────┘           │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                        DATA TIER                                 │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────┐         │
│  │  Postgres (Supabase)    │   │  Redis               │         │
│  │                         │   │  - Celery broker     │         │
│  │  - Event ledger         │   │  - Rate limiting      │         │
│  │  - Projections          │   │  - Session cache      │         │
│  │  - RLS tenant isolation │   └──────────────────────┘         │
│  │  - Read replicas (scale)│                                     │
│  └─────────────────────────┘   ┌──────────────────────┐         │
│                                 │  Object Storage (S3) │         │
│                                 │  - Closeout PDFs     │         │
│                                 │  - Batch photos      │         │
│                                 └──────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Data model

### Tenancy

Every table has `org_id UUID NOT NULL`. Postgres RLS enforces org isolation. The app role never has `BYPASSRLS`. No cross-tenant read is possible even if app code is wrong.

```
organizations
  └── organization_memberships (role: owner | admin | worker)
       └── farms
            └── sheds
                 └── batches
                      ├── mortality_events      (append-only)
                      ├── feed_movements        (append-only)
                      ├── daily_farm_rounds     (once per day)
                      ├── weight_records
                      ├── dispatch_records
                      └── health_observations
```

### Event ledger (immutable)

```sql
farm_events (
  id               UUID PRIMARY KEY,
  org_id           UUID NOT NULL,           -- tenant
  batch_id         UUID NOT NULL,
  event_type       TEXT NOT NULL,           -- mortality_entry | feed_issue | ...
  idempotency_key  TEXT NOT NULL UNIQUE,    -- safe retries
  supersedes_id    UUID REFERENCES farm_events(id),  -- corrections
  actor_id         UUID NOT NULL,           -- who
  device_id        UUID NOT NULL,           -- which device
  occurred_at      TIMESTAMPTZ NOT NULL,    -- when it happened (field time)
  synced_at        TIMESTAMPTZ,             -- when server received it
  payload          JSONB NOT NULL           -- the fact
)
```

### Projections (derived, rebuildable)

```sql
batch_metrics (
  batch_id         UUID PRIMARY KEY,
  live_birds       INTEGER,
  total_mortality  INTEGER,
  total_feed_kg    NUMERIC,
  total_weight_kg  NUMERIC,
  provisional_fcr  NUMERIC,
  feed_runway_days INTEGER,
  completeness_pct INTEGER,
  last_round_at    DATE,
  updated_at       TIMESTAMPTZ
)
```

Projections are rebuilt by Celery workers from the event ledger. If a projection is wrong or missing, run `rebuild_batch_metrics(batch_id)` — source data is untouched.

---

## 5. Offline-first sync

### Write path (farmer offline → cloud)

```
Farmer taps "Log mortality"
  ↓
Local write (SQLite / localStorage) — immediate UI update
  ↓
Append to outbox: { idempotency_key, event_type, payload, occurred_at }
  ↓
Background sync when connected:
  POST /v1/sync/push → { operations: [...] }
  ↓
FastAPI validates each op:
  - Check idempotency_key (already seen? return duplicate=true, skip)
  - Check batch access (org membership)
  - Validate business rules (mortality ≤ live birds)
  - Insert into farm_events
  - Enqueue outbox_events for worker
  ↓
Worker applies to projections (batch_metrics)
  ↓
Sync push response: { results: [{ status: accepted | duplicate | rejected }] }
  ↓
Client marks outbox item as synced or retries
```

### Read path (pull delta to second device)

```
GET /v1/sync/pull?cursor=<opaque_sequence_cursor>
  ↓
Server returns changed records since cursor (keyset pagination)
  ↓
Client merges into local store
  ↓
Response includes next_cursor for incremental pull
```

### Conflict resolution

- Same-batch writes from two devices: server timestamp wins for daily rounds (one per day unique constraint)
- Mortality events are always additive; no conflict possible
- Explicit corrections use `supersedes_id` — both versions preserved, UI shows correction history

---

## 6. Scalability design

### API tier

| Concern | Solution |
|---------|----------|
| Stateless FastAPI | Multiple instances behind a load balancer (Render / ECS) |
| Sync push latency | Validate + insert only; projections async via Celery |
| Peak morning load | Auto-scale based on CPU; Redis rate limiting per org |
| Slow queries | Indexes on `(org_id, batch_id, occurred_at)` |

### Database tier

| Concern | Solution |
|---------|----------|
| Read-heavy dashboard | Postgres read replicas for `/v1/batches` and projections |
| Write-heavy sync | Event ledger is append-only (no UPDATE contention) |
| Tenant isolation | RLS; no cross-org query possible |
| Connection pooling | PgBouncer (Supabase includes this) |
| Schema migrations | Numbered, additive only; never DROP in production |

### Worker tier

| Concern | Solution |
|---------|----------|
| Projection rebuild lag | Celery priority queues; batch_metrics rebuilt within 5s of push |
| Worker failure | Celery acks after success only; dead-letter queue for failures |
| Alert evaluation | Separate low-priority queue; 1-minute SLA |
| Report generation | On-demand queue; PDFs stored in S3, URL returned async |

### Estimated capacity (per node)

| Node | Capacity |
|------|----------|
| 1 FastAPI instance (2 vCPU, 2GB) | ~2,000 req/s (sync push) |
| 1 Celery worker (2 vCPU, 2GB) | ~500 projection rebuilds/min |
| Postgres (Supabase Pro) | ~10,000 connections via PgBouncer |
| Read replica | Offloads ~80% of dashboard reads |

For 100,000 farmers doing morning rounds (06:00–09:00 IST), peak is ~10,000 pushes/minute → 167 req/s → **2–3 FastAPI instances** handles this comfortably.

---

## 7. Security

### Authentication

```
Farmer logs in via OTP (Supabase Auth / SMS gateway)
  ↓
Supabase issues JWT (RS256, 1-hour expiry)
  ↓
JWT contains: sub (user_id), exp, iss
  ↓
FastAPI verifies signature + expiry
  ↓
org_id resolved from organization_memberships table (never trusted from token)
  ↓
role resolved from organization_memberships.role
```

### Authorization layers

```
Layer 1: FastAPI middleware — valid JWT required on all /v1/* routes
Layer 2: Business logic — org membership check per operation
Layer 3: Postgres RLS — every query filtered by auth.uid() → org_id
```

Even if layers 1 and 2 are bypassed (bug), RLS prevents cross-tenant data access at the database level.

### Secrets management

| Secret | Storage |
|--------|---------|
| DATABASE_URL | Environment variable (never in code) |
| JWT_SECRET / Supabase keys | Environment variable |
| SUPABASE_SERVICE_ROLE_KEY | Server-side only; never in client bundle |
| SMS gateway key | Environment variable |
| S3 credentials | IAM role (not static keys) |

---

## 8. Reliability and fault tolerance

| Failure scenario | Behavior |
|-----------------|---------|
| Farmer loses connectivity | Local write succeeds; outbox queued; sync resumes on reconnect |
| API server down | Client retries with exponential backoff; no data loss (outbox durable) |
| Worker crash | Celery acks after success; job requeued from dead-letter |
| Database failover | Supabase automatic failover; read replicas promote |
| Duplicate sync push | `idempotency_key` prevents duplicate events; response: `duplicate=true` |
| Wrong projection | Rebuild from event ledger at any time; source data untouched |
| Bad migration | Additive-only migrations; no DROP; rollback = new additive migration |

---

## 9. Observability

| Layer | Tool |
|-------|------|
| API request logs | Structured JSON → Cloudwatch / Datadog |
| Error tracking | Sentry (FastAPI + React) |
| Performance | FastAPI OpenTelemetry → Jaeger |
| DB slow queries | `pg_stat_statements` |
| Worker job health | Flower (Celery monitor) |
| Uptime | Health check endpoint `/health` → UptimeRobot / Pingdom |
| Business metrics | Daily active farms, sync success rate, mortality events/day |

---

## 10. Deployment topology (production)

```
DNS (Cloudflare)
  ├── app.murgimitra.com   →  Netlify (React PWA, CDN-cached)
  └── api.murgimitra.com   →  Render / AWS ALB
                                 ├── FastAPI instance 1
                                 ├── FastAPI instance 2
                                 └── FastAPI instance N (auto-scale)
                                        ↓
                                 Redis (Upstash / ElastiCache)
                                        ↓
                                 Celery workers (1–N, auto-scale)
                                        ↓
                                 Supabase Postgres
                                   ├── Primary (writes)
                                   └── Read replica (dashboard reads)
                                        ↓
                                 S3 / Supabase Storage (PDFs, photos)
```

### Environments

| Environment | Purpose |
|-------------|---------|
| `local` | Developer machine; `localhost:5173` + `localhost:8000` |
| `staging` | Full cloud stack; seeded with demo org; used for QA |
| `production` | Real farmers; zero-downtime deploys; DB migrations reviewed |

---

## 11. Growth phases

### Phase 1 — 0 to 1,000 farmers (now)

- Single FastAPI instance
- Single Celery worker
- Supabase free/pro tier
- Netlify frontend
- No read replicas needed

### Phase 2 — 1,000 to 50,000 farmers

- Auto-scaling FastAPI (2–4 instances)
- Celery worker pool (2–4 workers)
- Supabase read replica
- PgBouncer connection pooling
- SMS OTP via Twilio / MSG91
- CDN for static assets (already on Netlify)
- Sentry + Datadog

### Phase 3 — 50,000 to 500,000 farmers

- API gateway (rate limiting, DDoS protection)
- Extract reporting service (separate worker pool, heavy queries)
- Regional deployment in India (Mumbai AWS region for latency)
- Message queue upgrade: SQS or Kafka for outbox events
- Materialized views refreshed by worker instead of on-demand
- WhatsApp notification channel (Twilio / Meta API)
- Admin control plane (Poultry-Intelligence-Hub web dashboard)

### Phase 4 — 500,000+ farmers

- Multi-region Postgres (primary Mumbai + replica)
- Dedicated farm analytics data warehouse (BigQuery / Redshift)
- AI inference tier (post-MVP; reads only from projections)
- Integrator API (feed companies, vets, insurance)

---

## 12. Technology decisions summary

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite + TypeScript | Fast builds, strong types, large ecosystem |
| Mobile | Expo (React Native) | Code share with web, offline SQLite support |
| API | FastAPI (Python) | Fast to build, async, strong typing, easy ML integration later |
| Workers | Celery + Redis | Battle-tested; easy to scale workers independently |
| Database | Postgres (Supabase) | RLS, real-time, managed ops, PostgREST as bonus |
| Auth | Supabase Auth + OTP | SMS OTP fits Indian farmers; no password friction |
| Hosting (frontend) | Netlify | Zero-config CDN, instant deploys |
| Hosting (API) | Render → AWS ECS | Start simple, migrate when load demands |
| Storage | Supabase Storage / S3 | PDFs, photos, exports |
| Monitoring | Sentry + Datadog | Error tracking + infrastructure metrics |

---

## 13. What NOT to build (until justified)

| Idea | When to add |
|------|-------------|
| Microservices | Only when a domain needs independent deploy cadence or team |
| Kafka | Only when message volume exceeds Redis Celery capacity (~10M+/day) |
| GraphQL | Only if mobile query patterns require it |
| AI diagnosis | Post-MVP; reads projections only; never mutates events |
| Kubernetes | Only if Render/ECS auto-scaling is insufficient |
| Multi-cloud | Only if single-region availability is a business risk |

**Avoid over-engineering.** A single FastAPI process + Celery + Postgres will handle 100,000 farmers. Add complexity only when a specific bottleneck is measured, not anticipated.

---

## 14. Open questions (decide before Phase 2)

1. **SMS provider for OTP** — MSG91 (India-first) vs Twilio (global)?
2. **App language** — Hindi/Telugu/Marathi UI strings: i18n from day 1 or post-MVP?
3. **Offline storage on mobile** — SQLite (WatermelonDB) vs AsyncStorage? SQLite recommended for reliability.
4. **Pricing / multi-tenant isolation level** — shared Postgres schema (current) vs per-org schema?
5. **Integrator API** — do feed companies need read access to batch data? Defines permission model complexity.
