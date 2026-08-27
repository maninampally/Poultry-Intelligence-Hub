# Murgi Mitra — MVP

**Product:** Offline-first broiler farm operations for Indian farmers  
**Platform (V1):** Android (React Native / Expo)  
**Backend target:** FastAPI modular monolith + Celery + PostgreSQL (AWS Mumbai)  
**Status:** Prototype exists (TypeScript web/API). MVP delivery path is the event-ledger migration described in [`REPO_PLAN.md`](REPO_PLAN.md) and [`system_design.md`](system_design.md).

---

## 1. Product intent

Murgi Mitra helps small and mid-size broiler farmers run a grow-out cycle with reliable daily records — especially when connectivity is poor.

The V1 product is **not** a dashboard company, an AI company, or a marketplace. It is a **trusted field logbook** that syncs safely and produces correct live metrics.

### Design principles (non-negotiable)

1. **Offline is normal** — farmers write locally first; sync is background reliability, not a precondition for use.
2. **Farm facts are immutable events** — mortality, feed usage, weights, expenses, and sales are never overwritten; corrections are new compensating events.
3. **Projections are rebuildable** — live bird count, FCR, stock, and alerts are derived from the event ledger.
4. **AI is downstream only** — recommendations never mutate farm source data (post-MVP).
5. **Security is double-enforced** — application RBAC plus PostgreSQL RLS.

---

## 2. Who V1 serves

| Role | Surface | V1 scope |
|---|---|---|
| Farm owner | Android app | Primary user — create farm/shed/batch, log ops, see metrics/alerts |
| Farm worker | Android app | Log assigned shed/batch ops only (RBAC-scoped) |
| Developer / admin | Existing web app | Internal test, demo, and ops surface — **not** the farmer product |
| Family / accountant, vet, integrator | — | Explicitly **out of V1** |

**Public web in V1:** landing page only (optional). Do not let web feature work delay the farmer mobile path.

---

## 3. MVP outcome (definition of done)

The MVP is complete when this gate is true in a pilot farm:

> A farmer can log mortality offline, reconnect, sync without duplicates, see a correct live-bird count, apply a correction without erasing history, and remain isolated from other tenants.

That single vertical slice proves the production architecture. Other domains reuse the same pattern.

### Acceptance criteria (mortality slice)

- [ ] Mortality can be logged with airplane mode on; UI updates from local DB immediately.
- [ ] On reconnect, outbox push succeeds with idempotency keys.
- [ ] Retrying the same payload creates **exactly one** server event.
- [ ] `batch_metrics` (or equivalent projection) reflects live bird count and cumulative mortality.
- [ ] A correction creates a new event linked to the original; original remains unchanged.
- [ ] Sync pull updates a second device for the same farm.
- [ ] Another tenant cannot read or write the event (app auth + RLS).
- [ ] Audit / support can rebuild the projection from the event ledger.

---

## 4. In scope for MVP

### 4.1 Product modules

| Module | V1 capability |
|---|---|
| Identity | Phone OTP login, session/JWT, device registration |
| Tenancy / farm | Tenant, farm, shed, membership; owner + worker roles |
| Batches | Create batch, placement count, status machine (active → closed) |
| Mortality | Immutable events + corrections; morning/evening shift; cause |
| Feed | Usage events + inventory movements (purchase/receipt/usage/wastage) |
| Weight | Sample weight events vs breed standard curve (read projection) |
| Finance | Expense and sale events; basic cost/bird and margin at closeout |
| Health (light) | Vaccination schedule reminders + vaccination events |
| Sync | Local outbox, push/pull, cursors, rejection handling |
| Metrics | Live bird count, cumulative mortality %, FCR, basic alerts |
| Reporting | Batch summary PDF at closeout |
| Observability | Structured logs, error tracking, backup restore drill |

### 4.2 System capabilities (must ship with MVP)

```text
Mobile local write
  → immutable local event + sync outbox
  → HTTPS sync push (JWT + idempotency key)
  → FastAPI command path
  → farm_events + domain event table + outbox_events (one DB transaction)
  → Celery worker
  → projection / alert / notification
  → sync pull → mobile projections
```

### 4.3 Languages (MVP)

- English + Hindi + Tamil (UI strings)
- Voice / Bhashini: optional stretch; **not** a release blocker for the mortality gate

---

## 5. Explicitly out of scope for MVP

Do not build these until the mortality gate and core ops slices are stable:

- AI recommendations, LLM advice, health risk scores
- Marketplace, lending, feed ordering
- WhatsApp bot, IoT sensors, layer poultry
- Full multilingual expansion (Punjabi, Bengali, Marathi, Kannada)
- Integrator multi-farm control plane as a product
- Veterinarian shared-case workflows (beyond stub roles)
- Kubernetes, Kafka, Elasticsearch, separate AI platform
- Treating the web dashboard as the farmer V1 product

---

## 6. High-level system design (MVP)

```text
Farmer Android app
  └─ Local SQLite / WatermelonDB
       ├─ Domain / event records
       ├─ Sync outbox + cursor
       └─ Local read projections
             │
             │ HTTPS + JWT + idempotency
             ▼
        AWS ALB (Mumbai)
             │
             ▼
   FastAPI modular monolith (ECS Fargate)
     auth · tenancy · farms · batches · daily_ops
     feed · finance · health · sync · alerts · reporting
             │
             ▼
        RDS PostgreSQL
          farm_events · domain event tables
          projections · sync_operations · outbox · audit
          RLS on tenant-owned tables
             │
             ▼
   Celery + Redis
     metrics · alerts · FCM · PDF · reminders · DLQ
             │
     ┌───────┼────────┐
     ▼       ▼        ▼
    FCM     S3     OTel / Sentry / CloudWatch
```

### Core data rule

| Kind | Examples | Mutability |
|---|---|---|
| Source events | `mortality_events`, `feed_usage_events`, `sale_events` | Append-only |
| Reference | `tenants`, `farms`, `sheds`, `batches` | Controlled updates |
| Projections | `batch_metrics`, `feed_stock_snapshot`, `alerts` | Rebuildable |
| Sync / reliability | `sync_outbox`, `sync_operations`, `outbox_events` | Operational |

Corrections use compensating events with `supersedes_event_id` (or equivalent). Never edit the original fact row.

---

## 7. Build order (vertical slices)

Build only what proves the architecture. Do not broaden scope mid-slice.

1. Identity, tenant, farm, shed, RBAC
2. Batch create + status machine
3. Mobile SQLite schema, local events, outbox
4. **Mortality events + idempotent push/pull sync** ← primary MVP gate
5. Live bird count / cumulative mortality projection
6. Feed inventory movements + usage events
7. Weight samples, expenses, sales, batch closeout
8. Transactional outbox → alerts → FCM
9. PDF report, audit log, observability, backup restore drill
10. Pilot with real farms — then consider voice expansion, AI, marketplace

---

## 8. Success metrics (pilot, not vanity)

| Metric | Pilot target |
|---|---|
| Farms in pilot | 10–50 |
| Daily logs completed offline then synced | ≥ 90% of logged days |
| Duplicate mortality events after retries | 0 |
| Projection vs manual recount mismatches | 0 after rebuild |
| Time to first useful log after install | ≤ 10 minutes |
| Farmer NPS (pilot) | Qualitative pass / iterate |

Year-scale growth metrics belong in product strategy docs, not MVP exit criteria.

---

## 9. Relationship to current codebase

| Area | Today | MVP target |
|---|---|---|
| Farmer product | Web dashboard prototype | Android offline-first app |
| API | Express CRUD + mutable logs | FastAPI + event ledger + outbox |
| Worker | Scaffold | Celery projections / alerts / reports |
| Mobile | Strong scaffold (modules + sync primitives) | Production sync path for mortality first |
| Web | Active | Keep as admin/dev/demo; not farmer V1 |

See [`REPO_PLAN.md`](REPO_PLAN.md) for keep/replace decisions and migration phases.  
See [`system_design.md`](system_design.md) for definitive architecture detail.

---

## 10. One-line MVP statement

**Ship a production-grade offline mortality → sync → projection loop on Android against a Python event-ledger backend; then grow feed, weight, finance, and alerts on the same spine.**
