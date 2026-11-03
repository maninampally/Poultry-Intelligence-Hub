# Sync Protocol — Phase 4

Manual offline-first sync between browser and Supabase.

---

## Architecture

### State Layers

```
┌──────────────────────────────────────┐
│ Browser (React State)                │
│ - FarmApp state (batches[])         │
│ - Real-time UI updates               │
└──────────────────────────────────────┘
           ↕ (persist)
┌──────────────────────────────────────┐
│ Browser localStorage                 │
│ - pi-farm-state-v1         │
│ - pi-outbox-v1 (pending)   │
│ - pi-device-id             │
└──────────────────────────────────────┘
           ↕ (Sync Now button)
┌──────────────────────────────────────┐
│ Supabase (authoritative)             │
│ - batches, mortality, feed, etc.    │
│ - sync_operations (idempotent log)  │
│ - sync_cursors (delta tracking)     │
│ - audit_events                      │
└──────────────────────────────────────┘
```

### Demo Mode vs Cloud Mode

**Demo Mode (default):**
- No Supabase env vars set
- All data stays in localStorage
- No network calls
- SyncButton hidden
- Sync menu disabled
- Create/edit/delete flows: immediate localStorage write

**Cloud Mode (when Supabase env vars set):**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configured
- User logged in via `/login/cloud` with email/password
- Supabase auth session active
- SyncButton visible in app header
- Manual "Sync Now" triggers full push/pull cycle
- Create/edit/delete flows: immediate localStorage + queue pending operation

---

## Sync Flow: Push → Pull → Detect Conflicts

### 1. Push: Upload Pending Operations

```typescript
async function syncPush(client: SupabaseClient, orgId: string)
  → for each pending operation in outbox:
    → create sync_operations record (org_id + device_id + idempotency_key = unique)
    → mark operation synced/failed
    → return { synced_count, errors }
```

**Idempotency:** `(org_id, device_id, idempotency_key)` UNIQUE constraint
- Retry with same idempotency_key = server rejects (UNIQUE violation)
- No duplicate created
- Safe to retry indefinitely

**Payload structure (in outbox):**
```json
{
  "operationId": "abc12345",
  "idempotencyKey": "abc12345-1630704000000",
  "table": "mortality_events",
  "kind": "insert",
  "recordId": "uuid",
  "data": { "batch_id": "...", "count": 8, ... }
}
```

### 2. Pull: Fetch Server Changes Since Last Cursor

```typescript
async function syncPull(client: SupabaseClient, orgId: string, tables: string[])
  → for each table (batches, mortality_events, feed_movements):
    → get sync_cursor for (device_id, table_name)
    → fetch records WHERE updated_at >= last_pulled_at AND org_id = orgId
    → update cursor to now()
    → return { [table]: changes[] }
```

**Delta strategy:** Cursor per device per table
- Handles multi-device sync (each device pulls independently)
- Works offline → online (cursor persisted locally)
- Resets if cursor deleted (full re-pull on next sync)

### 3. Detect Conflicts: Server Updated After Local

```typescript
for each local batch:
  if server has same batch AND server.updated_at > local.updated_at:
    → conflict detected
    → show modal: local vs server, user chooses
    → set batch._conflictData = { serverVersion, choice }
```

**Conflict resolution:**
- User sees side-by-side JSON diff
- Choose "Keep Local" or "Accept Server"
- Choice saved locally
- Conflict marked resolved on next sync

---

## Local State Machine

```
       ┌─────────────────────────────────────┐
       │ Saved Locally (no pending op)       │
       │ _syncStatus: 'local'                │
       └─────────────────────────────────────┘
                  │
                  │ user edits batch
                  ↓
       ┌─────────────────────────────────────┐
       │ Pending Sync                        │
       │ _syncStatus: 'pending'              │
       │ _pendingOp: { ... }                 │
       │ (in localStorage outbox)            │
       └─────────────────────────────────────┘
                  │
                  │ user taps Sync Now
                  ↓
       ┌─────────────────────────────────────┐
       │ Syncing                             │
       │ _syncStatus: 'syncing'              │
       │ (push in progress)                  │
       └─────────────────────────────────────┘
                  │
        ┌─────────┼─────────┬─────────────┐
        │         │         │             │
        ↓         ↓         ↓             ↓
      Synced   Conflict  Error       Pull changes
        │         │         │             │
        └─────────┴─────────┴─────────────┘
                       │
                       ↓
       ┌─────────────────────────────────────┐
       │ Final State                         │
       │ _syncStatus: 'synced' | 'conflict' │
       │ _conflictData: {...} if conflict   │
       └─────────────────────────────────────┘
```

---

## SyncContext API

```typescript
interface SyncContextType {
  status: 'idle' | 'syncing' | 'synced' | 'conflict' | 'error' | 'needs-review';
  pendingCount: number;        // operations waiting to push
  conflictCount: number;        // batches with conflicts
  currentConflict: SyncConflict | null;
  lastSyncTime: Date | null;
  syncedCount: number;          // operations pushed this cycle
  errorCount: number;           // operations failed this cycle
  error: string | null;
  startSync: (batches: any[], orgId: string) => Promise<void>;
  resolveConflict: (batchId: string, choice: 'local' | 'server') => Promise<void>;
  clearError: () => void;
}
```

---

## UI States

### Status Indicator

| Status | Icon | Color | Meaning |
|--------|------|-------|---------|
| synced | ✓ | Green | All changes pushed, no conflicts |
| syncing | ⟳ | Blue | Push/pull in progress |
| conflict | ⚠ | Orange | Conflict detected, needs review |
| needs-review | ⚠ | Orange | Conflicts pending user choice |
| error | ✗ | Red | Push/pull failed, check network |

### Sync Button

- Hidden in demo mode
- Visible in cloud mode, top-right of app header
- Click to trigger manual sync
- Shows mini-menu: pending count, synced count, error count
- Disabled during sync

### Conflict Modal

Shows when conflict detected:
```
┌──────────────────────────────────────┐
│ Conflict Detected                    │
│ This record was modified elsewhere   │
├──────────────────────────────────────┤
│ Local Version      │ Server Version  │
│ {...json...}       │ {...json...}    │
│ [Keep Local]       │ [Accept Server] │
└──────────────────────────────────────┘
```

---

## Offline Behavior

### User Edits Batch While Offline

```
1. Click "Log Mortality" → form submit
2. App calls LocalRepository.queuePendingOp()
3. localStorage updated immediately
4. FarmApp state updates → UI reflects new record
5. Badge shows "Pending sync"
6. User works offline; can add more records
7. When online, Sync Now button works
8. Push/pull executes
9. If server has newer version → conflict modal
```

### No Sync = Local-Only

```
If user never taps Sync Now:
- All data remains in browser localStorage
- Operations stay in outbox
- Can close app, refresh page, come back later
- Records still there (until localStorage cleared)
- Can view/edit locally forever
```

---

## Error Handling

### Network Failure

```
syncPush() throws → catch → set status='error', show error message
User can retry: click Sync Now again
```

### Invalid Operation

```
syncPush() detects auth fail → set status='error'
User must login again (/login/cloud)
Pending operations kept in outbox for retry
```

### Conflict with Server

```
detectConflicts() finds server updated after local
→ stop sync, show ConflictResolver modal
→ user chooses local or server
→ next Sync Now continues (pull + remaining)
```

### Partial Failure

```
Some operations succeed, some fail:
syncedCount > 0, errorCount > 0
→ status = 'error'
→ show both results in sync menu
→ failed operations stay in outbox
→ user can fix and retry
```

---

## Calculation Parity

### Local (Demo Mode)

```typescript
// FarmApp.tsx line 248
liveBirds = placed - mortalityTotal - culls - sold + transfers_in
```

### Cloud (Supabase)

```sql
-- 20260101010003_calculation_helpers.sql
SELECT
  b.placed - COALESCE(SUM(m.count), 0) - COALESCE(MAX(c.count), 0) - ...
FROM batches b
LEFT JOIN mortality_events m ON b.id = m.batch_id
```

**Parity guarantee:** Same formula, different location
- Frontend calculates for fast UI updates
- Server calculates for data integrity checks
- Corrections preserve original facts (no recalculation)

---

## Testing Sync

### Local (No Internet)

```bash
# Start app in demo mode
pnpm dev
# No Supabase env vars = demo mode
# Create batch, log mortality
# Offline works forever

# Switch to cloud mode
export VITE_SUPABASE_URL=...
export VITE_SUPABASE_ANON_KEY=...
pnpm dev
# Visit /login/cloud, sign up
# Sync button appears
```

### Multi-Device Sync

```
Device A (phone):
  - Login on /login/cloud
  - Create batch, log mortality
  - Sync Now → pushes to Supabase
  
Device B (tablet):
  - Login on /login/cloud with same account
  - Pull data via Sync Now
  - See Device A's batch and records
  
Device A edits batch:
  - Device B pulls and sees update (no conflict)
  
Device B edits same batch while Device A offline:
  - Device A comes online
  - Sync Now triggers detectConflicts()
  - Conflict modal: user chooses
```

### Conflict Simulation

```
Device A: Log 8 mortality on 2026-08-28
Device B: Log 5 mortality on same date (offline)

Device A syncs first (now 8 on server)
Device B comes online, sync:
  → Push: operation with idempotency_key
  → Pull: batch fetched, see server has 8
  → Detect: local diff since pull started
  → Conflict modal: local shows 5, server shows 8
  → User chooses → resolved
```

---

## Performance & Limits

- **Per-sync payload:** assume < 10k records pulled
- **Outbox size:** assume < 100 pending operations
- **Conflict handling:** one conflict modal at a time
- **Retry logic:** manual (user clicks Sync Now again)

## Future: Background Sync

Phase 4 Step 8 (not yet implemented):
```typescript
// Listen to window focus
window.addEventListener('focus', () => {
  if (isCloudMode && !syncing) {
    startSync(batches, orgId);
  }
});
```

---

## Security Notes

- Sync operations use anon key only (RLS enforced)
- Device ID generated locally, persisted in localStorage
- Idempotency key prevents replay attacks
- Timestamps prevent out-of-order sync
- Corrections never overwrite originals
- Audit events log all privileged actions

No service-role key in browser. Phase 4 backend (if needed) uses service-role for admin actions only.
