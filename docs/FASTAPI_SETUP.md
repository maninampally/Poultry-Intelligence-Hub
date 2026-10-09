# FastAPI Backend Implementation

Complete Python/FastAPI backend replacing Node.js/Express, with Celery workers for async tasks.

---

## Architecture

```
┌─────────────────────────┐
│  React Web (Vite)       │
│  Port: 5173             │
└────────────┬────────────┘
             │ HTTP
             ▼
┌─────────────────────────┐
│  FastAPI API            │
│  Port: 8000             │
│  - Sync push/pull       │
│  - Auth, farms, batches │
└────────────┬────────────┘
             │
        ┌────┴────┐
        ▼         ▼
   ┌─────────┐ ┌──────────┐
   │Postgres │ │  Redis   │
   │ 5432    │ │  6379    │
   └─────────┘ └────┬─────┘
                    │
                    ▼
            ┌──────────────┐
            │ Celery Worker│
            │ - Tasks      │
            └──────────────┘
```

---

## What's implemented

### FastAPI Backend (`/api`)

- `main.py` — FastAPI app initialization, CORS, lifespan
- `db.py` — AsyncPG connection pool, database methods
- `auth.py` — JWT verification, AuthContext dependency
- `routes/`
  - `health.py` — `/health` endpoint (no auth)
  - `auth.py` — `/api/v1/auth/*` (bootstrap, /me)
  - `farms.py` — `/api/v1/farms/*` (CRUD)
  - `batches.py` — `/api/v1/batches/*` (CRUD)
  - `sync.py` — `/api/v1/sync/*` (push, pull, register-device)

### Celery Worker (`/worker`)

- `celery_app.py` — Celery app configuration, Redis broker
- `tasks.py` — Async tasks
  - `rebuild_batch_metrics()` — Rebuild projections from event ledger
  - `evaluate_alerts()` — Rule engine (mortality spike, feed low)
  - `generate_batch_report()` — PDF/JSON closeout reports
  - `health_check()` — Periodic worker health ping

---

## Local setup

### Prerequisites

- Python 3.11+
- Redis running (`redis-server`)
- PostgreSQL running (Docker or local)
- Node.js for frontend dev

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set environment variables

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Run migrations

```bash
# Using Supabase CLI
supabase db push

# OR manually via psql
psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/011_event_ledger.sql
psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/012_batch_metrics_projection.sql
psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/013_rebuild_projections.sql
psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/014_idempotency_tracking.sql
```

### 4. Start FastAPI server

```bash
# Terminal 1
uvicorn api.main:app --reload --port 8000
```

### 5. Start Celery worker

```bash
# Terminal 2
celery -A worker.celery_app worker --loglevel=info
```

### 6. Start frontend

```bash
# Terminal 3
npm install
npm run dev
```

Visit `http://localhost:5173` → API calls go to `http://localhost:8000`.

---

## Docker deployment

```bash
docker-compose up
```

Services:
- **postgres** → `localhost:5432`
- **redis** → `localhost:6379`
- **fastapi** → `localhost:8000`
- **worker** → Celery background
- **web** → `localhost:3000` (compiled React)

---

## API endpoints

All authenticated endpoints require `Authorization: Bearer <jwt_token>`.

### Auth
- `POST /api/v1/auth/bootstrap` — Create org + initial farm on first login
- `GET /api/v1/auth/me` — Current user info

### Farms
- `GET /api/v1/farms` — List farms
- `POST /api/v1/farms` — Create farm
- `POST /api/v1/farms/{farm_id}/sheds` — Add shed

### Batches
- `GET /api/v1/batches` — List batches
- `POST /api/v1/batches` — Create batch
- `POST /api/v1/batches/{batch_id}/close` — Close batch

### Sync (Event Ledger)
- `POST /api/v1/sync/push` — Apply operations (mortality, feed, weight, etc)
- `GET /api/v1/sync/pull?cursor=...` — Pull changed metrics and events
- `POST /api/v1/sync/register-device` — Register device UUID for sync

### Health
- `GET /health` — Health check (no auth required)

---

## Sync protocol

### Push (write locally → cloud)

**Request:**
```json
POST /api/v1/sync/push
{
  "device_id": "uuid",
  "operations": [
    {
      "idempotency_key": "unique-key",
      "event_type": "mortality_entry",
      "batch_id": "batch-uuid",
      "occurred_at": "2026-09-14",
      "payload": {"count": 5, "reason": "heat stress"}
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "idempotency_key": "unique-key",
      "status": "accepted",
      "record_id": "event-uuid"
    }
  ],
  "summary": {"total": 1, "accepted": 1, "duplicates": 0, "rejected": 0},
  "server_time": "2026-09-14T12:30:45.123456"
}
```

**Status codes:**
- `accepted` — Event inserted, projection rebuild queued
- `duplicate` — Idempotency key seen before, safe to ignore
- `rejected` — Validation error (batch not found, etc)

### Pull (sync to second device)

**Request:**
```
GET /api/v1/sync/pull?cursor=<opaque_token>
```

**Response:**
```json
{
  "batch_metrics": [
    {
      "batch_id": "uuid",
      "org_id": "uuid",
      "live_birds": 4950,
      "total_mortality": 50,
      "cumulative_mortality_pct": 1.0,
      "updated_at": "2026-09-14T12:30:45.123456"
    }
  ],
  "farm_events": [
    {
      "id": "uuid",
      "event_type": "mortality_entry",
      "occurred_at": "2026-09-14",
      "synced_at": "2026-09-14T12:30:45.123456",
      "payload": {"count": 5, "reason": "heat stress"}
    }
  ],
  "cursor": "<next_opaque_token>",
  "has_more": false,
  "server_time": "2026-09-14T12:31:00.000000"
}
```

**Cursor:**
- Base64-encoded JSON: `{"since": "2026-09-14T12:30:45.123456"}`
- Pass as `?cursor=<value>` for incremental pull
- Null = start from epoch (full history)

---

## Error handling

Errors return HTTP status codes + JSON body:

```json
{
  "detail": "error message"
}
```

Common codes:
- `400` — Validation error (bad payload)
- `401` — Unauthorized (missing/invalid JWT)
- `403` — Forbidden (not member of org)
- `404` — Not found (batch, farm, etc)
- `500` — Server error (database, etc)

---

## Worker tasks

Tasks run asynchronously on Celery. Monitor in Flower (optional):

```bash
pip install flower
celery -A worker.celery_app events &
flower -A worker.celery_app
# http://localhost:5555
```

### rebuild_batch_metrics

Recalculates live_birds, mortality %, FCR, feed runway from event ledger.

**Triggered:** Automatically after sync push (event inserted)
**Retry:** 3 times with exponential backoff (60s, 120s, 240s)
**Timeout:** 30 min hard limit, 25 min soft limit

### evaluate_alerts

Checks batch metrics against rules:
- Mortality > 2% cumulative → warning
- Feed runway < 3 days → critical

**Triggered:** On-demand or periodic
**Retry:** 2 times
**Timeout:** 10 min

### generate_batch_report

Generates closeout report (PDF or JSON).

**Triggered:** On-demand
**Retry:** No retry (non-critical)
**Returns:** Report data or S3 URL (if S3 configured)

---

## Production deployment

### Environment

```bash
# .env (production)
DATABASE_URL=postgresql://user:pass@prod-db:5432/poultry_intelligence
REDIS_URL=redis://prod-redis:6379/0
JWT_SECRET=<generate_32_char_random>
ALLOWED_ORIGINS=https://app.murgimitra.com,https://api.murgimitra.com
NODE_ENV=production
```

### Render (PaaS example)

1. Create three services:
   - **FastAPI** (Web Service) → `Dockerfile.api`
   - **Celery Worker** (Background Worker) → `Dockerfile.worker` + `celery -A worker.celery_app worker`
   - **React Frontend** (Static Site) → build output to CDN

2. Environment variables → Render dashboard

3. Auto-deploy on git push

### Supabase (Database + Auth)

- Use Supabase Postgres (RLS policies already in place)
- Use Supabase Auth for OTP (if integrating)
- Store JWTs from Supabase or issue custom JWTs

### Redis

- Upstash (managed Redis as a service)
- Or AWS ElastiCache
- Connection via `REDIS_URL`

---

## Monitoring

### Logs

- **FastAPI:** Structured JSON to stdout (capture with Datadog, Cloudwatch)
- **Worker:** Celery logs to stdout
- **Database:** Postgres slow query log

### Health checks

```bash
# API
curl http://localhost:8000/health

# Postgres
SELECT 1

# Redis
redis-cli PING

# Worker
celery -A worker.celery_app inspect active
```

### Metrics to track

- API request latency (p50, p95, p99)
- Sync push success rate
- Worker task queue depth
- Database connection pool usage
- Projection rebuild latency

---

## Troubleshooting

### "Connection refused: localhost:6379"
Redis not running. Start it:
```bash
redis-server  # macOS: brew services start redis
```

### "Celery worker not processing tasks"
1. Check Redis is running: `redis-cli PING`
2. Check worker logs: Look for `worker.tasks` import errors
3. Restart worker: `Ctrl+C` and run command again

### "Event inserted but metrics not rebuilding"
1. Check worker is running
2. Check Celery task shows up in logs
3. Manually rebuild: `SELECT rebuild_batch_metrics('batch-id')`

### "JWT token expired"
- Token expiry is 1 hour (hardcoded in current implementation)
- Client should refresh token or re-login

---

## Next steps

### Phase 2B — Frontend integration
- Update client outbox to actually call `queuePendingOp()`
- Integrate SyncButton to trigger sync on demand
- Show sync status in UI

### Phase 2C — Additional routes
- `/api/v1/batches/{id}/mortality` — Log mortality (direct endpoint, optional)
- `/api/v1/batches/{id}/feed` — Log feed usage
- `/api/v1/reports/{id}` — Generate PDF closeout

### Phase 3 — Scale
- Read replicas for dashboard queries
- Rate limiting per org
- Monitoring + alerting
- Message queue upgrade (Kafka if > 10M events/day)

---

## Tech stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | FastAPI | Async, type hints, auto OpenAPI docs |
| Database | AsyncPG + Postgres | Async driver, RLS multi-tenancy |
| Task queue | Celery + Redis | Battle-tested, scales horizontally |
| Frontend | React + Vite | Existing; unchanged |
| Deployment | Docker Compose (local) / Render (prod) | Fast iteration, managed services |

---

## Questions?

See `docs/SYSTEM_DESIGN.md` for full architecture and scalability decisions.
