# Poultry Intelligence Data Model

Complete reference for canonical operational data.

## Tenancy (Phase 2)

### Organizations
Tenant boundary. One org = one farm business.
```
organizations
  ├─ id (UUID)
  ├─ name
  └─ created_at, updated_at
```

### Profiles
Auth users mapped to identity records.
```
profiles
  ├─ id (auth.uid, UUID)
  ├─ email
  ├─ full_name
  └─ created_at, updated_at
```

### Organization Memberships
Role binding: which user has which role in org.
```
organization_memberships
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ user_id → auth.users
  ├─ role: owner | admin | worker
  └─ created_at, updated_at
```

### Devices
Multi-device tracking for offline sync.
```
devices
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ user_id → auth.users (optional, nullable)
  ├─ name (e.g., "Worker Phone")
  └─ created_at, updated_at
```

---

## Operational Data (Phase 3)

### Farms
Physical farm locations.
```
farms
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ name (e.g., "Sri Lakshmi Poultry Farm")
  ├─ location (e.g., "Namakkal, Tamil Nadu")
  ├─ created_by → auth.users
  └─ created_at, updated_at
```

### Sheds
Houses within farm.
```
sheds
  ├─ id (UUID)
  ├─ farm_id → farms
  ├─ name (e.g., "Shed A")
  ├─ capacity (max birds)
  └─ created_at, updated_at
```

### Shed Assignments
Which workers can access which sheds.
```
shed_assignments
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ user_id → auth.users
  ├─ shed_id → sheds
  └─ created_at
```

### Batches
Flock lifecycle. Immutable except `closed` flag.
```
batches
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ farm_id → farms
  ├─ shed_id → sheds
  ├─ name (e.g., "B-2026-08-01")
  ├─ placed_date (DATE)
  ├─ placed (number of chicks placed)
  ├─ capacity (shed capacity on placement)
  ├─ closed (BOOLEAN, lifecycle flag only)
  ├─ created_by → auth.users
  └─ created_at, updated_at
  
Schema: immutable core + closed flag for closeout workflow
No historical snapshots: use record_corrections for audit
```

---

## Event Log (Append-Only)

### Placement Records
When birds are placed in a batch. One or more per batch lifecycle.
```
placement_records
  ├─ id (UUID)
  ├─ batch_id → batches (immutable)
  ├─ org_id → organizations
  ├─ shed_id → sheds
  ├─ occurred_at (TIMESTAMP, when placement happened)
  ├─ created_at (TIMESTAMP, when record created)
  ├─ created_by → auth.users
  ├─ source_device_id → devices
  ├─ placed_count (number placed this time)
  ├─ breed, hatch_date, supplier
  ├─ notes
  └─ schema_version
  
Immutable: never updated or deleted
```

### Mortality Events
Birds that died. Append-only.
```
mortality_events
  ├─ id (UUID)
  ├─ batch_id → batches
  ├─ org_id → organizations
  ├─ shed_id → sheds (optional)
  ├─ occurred_date (DATE of mortality observation)
  ├─ created_at (TIMESTAMP when recorded)
  ├─ created_by → auth.users
  ├─ source_device_id → devices
  ├─ count (number dead, >= 0)
  ├─ reason (e.g., "Early losses", "Heat stress")
  └─ schema_version
  
Pattern: one event per day per batch (UNIQUE batch_id, occurred_date)
But multiple records allowed if retried/offline sync creates duplicates
Constraint: count >= 0
Calculation: SUM(count) = total mortality for batch
```

### Feed Movements
Feed stock transactions. Append-only, multi-kind.
```
feed_movements
  ├─ id (UUID)
  ├─ batch_id → batches
  ├─ org_id → organizations
  ├─ shed_id → sheds (optional)
  ├─ occurred_date (DATE of transaction)
  ├─ created_at (TIMESTAMP when recorded)
  ├─ created_by → auth.users
  ├─ source_device_id → devices
  ├─ kind: opening_balance | purchase | issued | wastage | adjustment_in | adjustment_out
  ├─ quantity_kg (>= 0)
  ├─ notes
  └─ schema_version

Pattern: multiple per day per batch (no uniqueness)
Calculation: SUM(+purchase +opening_balance +adjustment_in, -issued -wastage -adjustment_out) = current stock
```

### Daily Farm Rounds
Once per day per batch. Tracks completeness + captures observations.
```
daily_farm_rounds
  ├─ id (UUID)
  ├─ batch_id → batches
  ├─ org_id → organizations
  ├─ occurred_date (DATE, unique per batch)
  ├─ created_at (TIMESTAMP)
  ├─ created_by → auth.users
  ├─ source_device_id → devices
  
  ├─ mortality_count (INTEGER, NULL = not recorded, 0 = recorded as zero)
  ├─ mortality_reason (TEXT)
  ├─ feed_issued_kg (NUMERIC, NULL = not recorded)
  ├─ water_notes (TEXT)
  ├─ health_notes (TEXT)
  
  ├─ is_complete (BOOLEAN, true if both mortality_count and feed_issued_kg recorded)
  ├─ general_notes (TEXT)
  └─ schema_version

Pattern: UNIQUE(batch_id, occurred_date)
Null handling: NULL = user didn't enter it, 0 = user entered zero
Calculation: COUNT(WHERE is_complete AND occurred_date = TODAY) = daily status
```

---

## Audit Trail

### Record Corrections
Links to original record, preserves snapshot, reason.
```
record_corrections
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ target_table (e.g., "mortality_events")
  ├─ target_record_id (UUID of mortality_events record)
  ├─ original_snapshot (JSONB, full copy of original)
  ├─ corrected_values (JSONB, { field: new_value, ... })
  ├─ reason (e.g., "Data entry error", "Double-counted on sync")
  ├─ created_at (TIMESTAMP)
  ├─ created_by → auth.users
  └─ schema_version

Pattern: append-only audit record
Usage: "Mortality recorded 8 on 2026-08-28, corrected to 5 (reason: recount)"
Calculation: corrections don't modify original, front-end can apply locally if needed
Display: show both original + correction in history
```

### Audit Events
Privileged actions log.
```
audit_events
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ user_id → auth.users
  ├─ action (e.g., "batch_closed", "correction_created", "device_synced")
  ├─ table_name (e.g., "batches")
  ├─ record_id (UUID)
  ├─ changes (JSONB, before/after if applicable)
  └─ created_at (TIMESTAMP)

Pattern: fire-and-forget logging
Usage: compliance, troubleshooting, multi-user conflict analysis
```

---

## Sync Primitives

### Sync Operations
Idempotent push log for offline-first sync.
```
sync_operations
  ├─ id (UUID)
  ├─ org_id → organizations
  ├─ device_id → devices
  ├─ idempotency_key (TEXT, unique constraint with org + device)
  ├─ table_name (e.g., "mortality_events")
  ├─ operation (insert | update | upsert | delete)
  ├─ record_id (UUID, the remote record being synced)
  ├─ data (JSONB, full record payload)
  ├─ created_at (TIMESTAMP when sync started)
  ├─ status (pending | synced | conflict | failed)
  ├─ error_message (if failed)
  └─ UNIQUE(org_id, device_id, idempotency_key)

Pattern: one per local change
Idempotency: retry with same idempotency_key = no duplicate
Constraint: org + device + key must be unique (prevents replay)
```

### Sync Cursors
Delta pull state. Tracks last sync timestamp per table per device.
```
sync_cursors
  ├─ id (UUID)
  ├─ device_id → devices
  ├─ table_name (e.g., "batches")
  ├─ last_pulled_at (TIMESTAMP, resume point for next pull)
  └─ UNIQUE(device_id, table_name)

Pattern: one per device per table
Pull query: SELECT * FROM {table} WHERE updated_at > cursor.last_pulled_at
Update: after pull, set last_pulled_at = now()
```

---

## Calculation Ownership

| Calculation | Formula | Computed Where | Immutable | Notes |
|---|---|---|---|---|
| Live bird count | placed - mortality - culls - sold + transfers | Server function + frontend demo | No | May change if corrections applied |
| Mortality total | SUM(mortality_events.count) | Server view + frontend demo | Yes (events immutable) | Corrections tracked separately |
| Mortality % | (mortality_total / placed) * 100 | Frontend only | Derived | Read-only display |
| Feed stock | SUM(feed_movements qty) | Server function + frontend | Derived | Depends on movement accuracy |
| Daily complete | COUNT(daily_farm_rounds where is_complete) | Frontend only | Derived | Status display |
| FCR | feed_issued / (placed - mortality) * weight | Frontend demo only | Derived | Phase 4+ only, depends on weights |
| Cost per bird | total_expense / placed | Frontend demo only | Derived | Financial, phase 4+ |

---

## RLS Authorization Matrix

| Table | Owner | Admin | Worker |
|-------|-------|-------|--------|
| farms | RW | RW | None |
| sheds | RW | RW | R (assigned) |
| batches | RW | RW | R (assigned shed) |
| placement_records | R | R | R (assigned batch) |
| mortality_events | RW | RW | RW (assigned batch) |
| feed_movements | RW | RW | RW (assigned batch) |
| daily_farm_rounds | RW | RW | RW (assigned batch) |
| record_corrections | RW | RW | R (own) |
| sync_operations | RW | RW | R (own device) |
| audit_events | RW | RW | None |

RW = full CRUD; R = SELECT only

---

## Constraints

### Data Integrity
- `mortality_events.count >= 0` — no negative deaths
- `feed_movements.quantity_kg >= 0` — no negative feed
- `batches.placed > 0` — must place at least one bird
- `sheds.capacity > 0` — shed must have capacity
- `placement_records.placed_count > 0` — at least one placed

### Uniqueness
- `organization_memberships(org_id, user_id)` — one role per user per org
- `shed_assignments(user_id, shed_id)` — one assignment per user per shed
- `daily_farm_rounds(batch_id, occurred_date)` — one round per day per batch
- `sync_operations(org_id, device_id, idempotency_key)` — idempotency
- `sync_cursors(device_id, table_name)` — one cursor per table per device

### Foreign Keys
All foreign keys have ON DELETE CASCADE to clean up orphans.
Exception: `devices.user_id` is nullable (device survives user deletion in shared context).

---

## Timestamps

All timestamps use TIMESTAMP WITH TIME ZONE (UTC). Frontend converts to local display.

- `created_at` — immutable, set when record created
- `updated_at` — mutable, updated on any change
- `occurred_date` — DATE (not TIMESTAMP) for daily events; facilitates grouping

---

## Schema Versioning

Each table has `schema_version` INTEGER DEFAULT 1 for backward-compatible migrations.
Future schema changes increment version; old clients can handle known versions.

---

## Next Steps (Phase 4+)

- Weight tracking: `weight_records(batch_id, occurred_date, age, average_kg, sample_size)`
- Health observations: `health_records(...)`
- Vaccination log: `vaccination_records(...)`
- Biosecurity rounds: `biosecurity_rounds(...)`
- Visitor log: `visitor_log(...)`
- Placement dispatch: `dispatch_records(...)`
- Expenses: `expense_records(...)` (out of scope for this phase)
- Sales: `sales_records(...)` (out of scope for this phase)

All future tables follow same patterns:
- Append-only where factual (events, observations)
- RLS org-scoped or shed-scoped
- Unique timestamps for delta sync
- Idempotency tracking via sync_operations
