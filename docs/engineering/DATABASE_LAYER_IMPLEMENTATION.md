# Database Layer Implementation — Phase 1

Event-driven architecture with immutable event ledger + derived projections.

---

## What was added

### 1. `farm_events` table (011_event_ledger.sql)
**Immutable append-only event ledger**

- `id` — unique event identifier
- `org_id` — tenant isolation
- `batch_id` — which batch
- `event_type` — mortality_entry | feed_issue | weight_sample | etc
- `idempotency_key` — unique per org+device for safe retries
- `supersedes_id` — reference to previous event (for corrections)
- `actor_id` — who made the entry
- `device_id` — which device
- `occurred_at` — when it happened (field time, not server time)
- `synced_at` — when server received it
- `payload` — JSONB fact data

**Key properties:**
- Never updated or deleted (immutable)
- Indexed on `(org_id, batch_id, occurred_at)` for queries
- RLS enforces org isolation
- Idempotency key prevents duplicate processing

### 2. `batch_metrics` table (012_batch_metrics_projection.sql)
**Derived projections (fully rebuildable)**

Computed columns from event ledger:
- `live_birds` — placed - mortality - sold
- `total_mortality` — sum of mortality events
- `cumulative_mortality_pct` — mortality/placed %
- `latest_weight_kg` — most recent sample
- `provisional_fcr` — feed/weight ratio
- `feed_runway_days` — days until stock-out
- `days_in_batch` — age of batch
- `completeness_pct` — % of record types filled

**Key property:**
- If a projection is wrong, rebuild it from `farm_events`
- Source data (events) is never modified
- Automatic update via trigger

### 3. `rebuild_batch_metrics()` function (013_rebuild_projections.sql)
**Recalculates projections from event ledger**

```sql
SELECT rebuild_batch_metrics(batch_id);
```

Does:
1. Sum mortality events (excluding superseded)
2. Sum feed events (purchase - usage)
3. Get latest weight sample
4. Calculate live birds, FCR, runway
5. Upsert `batch_metrics` row

**Can be called anytime** — fixes corrupted projections without touching source data.

### 4. `sync_idempotency` table (014_idempotency_tracking.sql)
**Tracks which operations already processed**

Prevents duplicate processing of sync pushes:
- Key: `(org_id, device_id, idempotency_key)`
- Value: `{status: accepted|duplicate|rejected, applied_at}`

---

## How to apply locally

### Prerequisites
- Docker running (PostgreSQL container)
- Current migrations already applied (001-010)

### Steps

```bash
# 1. Run migrations via Supabase CLI
supabase db push

# OR manually via psql:
# psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/011_event_ledger.sql
# psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/012_batch_metrics_projection.sql
# psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/013_rebuild_projections.sql
# psql -h localhost -U postgres -d poultry_intelligence < supabase/migrations/014_idempotency_tracking.sql
```

### Verify

```sql
-- Check tables exist
\dt farm_events batch_metrics sync_idempotency

-- Check RLS policies
\d farm_events

-- Test rebuild function
SELECT rebuild_batch_metrics('batch-id-here');
```

---

## Data migration (existing app → event ledger)

To migrate existing mortality/feed/weight records to event ledger:

```sql
-- Insert mortality records as events
INSERT INTO farm_events (org_id, batch_id, event_type, idempotency_key, actor_id, device_id, occurred_at, payload)
SELECT 
  b.org_id,
  m.batch_id,
  'mortality_entry',
  'migrate-mortality-' || m.id, -- unique key
  b.owner_id,
  null,
  m.date,
  jsonb_build_object(
    'count', m.count,
    'reason', m.reason,
    'migratedFrom', 'mortality_events'
  )
FROM mortality m
JOIN batches b ON b.id = m.batch_id;

-- Similar for feed_movements → feed_issue events
-- Similar for weights → weight_sample events

-- Then rebuild all projections
DO $$
DECLARE
  batch_row RECORD;
BEGIN
  FOR batch_row IN SELECT DISTINCT batch_id FROM farm_events LOOP
    PERFORM rebuild_batch_metrics(batch_row.batch_id);
  END LOOP;
END $$;
```

---

## Next steps (Phase 1B)

1. **Update sync API** (`server/routes/sync.ts`)
   - Check idempotency key before processing
   - Insert into `farm_events` instead of directly to mortality/feed/weight
   - Record result in `sync_idempotency`

2. **Update local writes** (client outbox)
   - Attach `idempotency_key` to each operation
   - Track `event_type` (mortality_entry, feed_issue, etc)

3. **Update dashboard queries**
   - Read from `batch_metrics` for performance
   - Fall back to rebuilding if stale

4. **Add Celery worker** (Phase 1C)
   - Listen for `farm_events` inserts
   - Rebuild projections async (currently synchronous via trigger)

---

## Benefits of this schema

✅ **Audit trail** — every change is immutable and timestamped  
✅ **Corrections are explicit** — supersedes_id links old → new  
✅ **Safe retries** — idempotency_key prevents duplicates  
✅ **Rebuildable** — if projection is wrong, rebuild from source  
✅ **Scalable** — Celery can rebuild projections in background  
✅ **Tenant isolated** — RLS at DB layer, independent of app code  

---

## Files added

- `supabase/migrations/011_event_ledger.sql` — farm_events table + RLS
- `supabase/migrations/012_batch_metrics_projection.sql` — batch_metrics table + trigger
- `supabase/migrations/013_rebuild_projections.sql` — rebuild function + trigger
- `supabase/migrations/014_idempotency_tracking.sql` — idempotency tracking

All use Postgres best practices:
- Immutable tables (no UPDATE)
- Indexes on query patterns
- RLS for multi-tenancy
- Triggers for automation
- Logical deduplication via unique keys
