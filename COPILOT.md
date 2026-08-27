# Copilot prompt guide — Murgi Mitra

Use this file to start every Copilot session. Copy a template below, fill in the bracketed parts, and attach or `@`-mention the listed docs.

---

## Docs to read (pick by task)

| Task | Read first | Also read |
|---|---|---|
| **Any new production code** | `system_design.md` | `MVP.md`, `REPO_PLAN.md` |
| **Scope / priority check** | `MVP.md` | `REPO_PLAN.md` (current phase) |
| **File placement / migration** | `REPO_PLAN.md` | `system_design.md` |
| **Legacy Express / web fixes only** | `docs/architecture.md` | `REPO_PLAN.md` (note: temporary stack) |

**Do not use as sole source:** old full product spec, `README.md` alone, or assumptions from Express CRUD patterns.

---

## Global rules (paste into every session)

```text
Project: Murgi Mitra (Poultry Intelligence Hub)

Read these files before generating code:
- system_design.md
- MVP.md
- REPO_PLAN.md

Architecture rules:
1. Farm facts are immutable events; corrections are compensating events.
2. Projections are rebuildable from the event ledger.
3. Offline-first mobile is the farmer V1 product; web is admin/demo only.
4. Target backend: FastAPI + packages/backend-core + Celery + PostgreSQL.
5. AI, marketplace, IoT, and integrator features are OUT OF SCOPE unless I say otherwise.

Code rules:
- Match existing naming and folder conventions in the repo.
- Minimal diff; do not refactor unrelated files.
- No business logic in API routers.
- No direct cross-module table writes.
- Every sync write must be idempotent (operationId + idempotencyKey).
- Prefer vertical slices over broad scaffolding.

Current phase: [Phase 0–7 from REPO_PLAN.md]
Task: [one sentence]
Files to create or edit: [paths]
Out of scope for this task: [list]
```

---

## Phase templates

### Phase 0 — Freeze / baseline

```text
Read: MVP.md, REPO_PLAN.md, docs/architecture.md

Phase 0: baseline current Express stack.
Task: [e.g. export OpenAPI baseline / add smoke test for mortality route]

Constraints:
- Do not start FastAPI migration yet.
- Document existing endpoints and tables.
- Minimal changes only.
```

### Phase 1 — Python skeleton

```text
Read: system_design.md, REPO_PLAN.md, MVP.md

Phase 1: add Python skeleton alongside existing code.
Task: [e.g. FastAPI /health + packages/backend-core package layout]

Generate:
- apps/api/app/main.py (FastAPI entrypoint only)
- packages/backend-core/pyproject.toml + src/murgi_mitra/core/ stubs
- Celery bootstrap in apps/worker

Constraints:
- Do not delete Express or packages/db yet.
- No business logic beyond health check.
- Alembic owns new migrations under db/migrations/.
```

### Phase 2 — Event ledger tables

```text
Read: system_design.md, REPO_PLAN.md

Phase 2: introduce event ledger schema.
Task: Alembic migration for farm_events, sync_operations, sync_cursors,
      outbox_events, audit_log, mortality_events

Constraints:
- Do not drop mortality_logs yet.
- Follow schema boundaries: auth / app / internal / analytics.
- Include indexes for tenant_id, farm_id, batch_id, occurred_at.
```

### Phase 3 — Mortality gate (primary MVP slice)

```text
Read: system_design.md, MVP.md, REPO_PLAN.md

Phase 3: mortality end-to-end — this is the MVP gate.

Flow:
Mobile mortality form
  → local event + sync outbox
  → FastAPI POST /v1/sync/push
  → idempotency validation
  → farm_events + mortality_events + outbox_events (one transaction)
  → Celery metrics task
  → batch_metrics projection
  → sync pull back to mobile

Task: [e.g. FastAPI sync push handler for mortality-entry create]

Acceptance (must satisfy):
- Offline log works locally
- Retry creates exactly one server event
- Correction preserves original event
- Projection shows correct live bird count
- Tenant isolation enforced

Match existing mobile types:
- apps/mobile/src/core/sync/
- apps/mobile/src/modules/mortality/

Do not implement feed, weight, finance, or AI in this task.
```

### Phase 4 — Feed / inventory

```text
Read: system_design.md, MVP.md, REPO_PLAN.md

Phase 4: feed inventory as movement ledger.
Task: [e.g. feed_usage_events + feed_inventory_movements]

Constraints:
- Stock is derived from movements, not manual balance edits.
- Same event + outbox + projection pattern as mortality.
- Do not migrate weight/finance yet.
```

### Phase 5 — Performance / finance

```text
Read: system_design.md, MVP.md, REPO_PLAN.md

Phase 5: weight, expense, sale events + batch_metrics.
Task: [specific module]

Projection fields required:
- calculation_version
- last_processed_event_id
- last_calculated_at
- projection_status (pending | current | failed)
```

### Phase 6 — RBAC + RLS

```text
Read: system_design.md, REPO_PLAN.md

Phase 6: tenant isolation.
Task: [e.g. RLS policies on mortality_events + farm_events]

Roles: owner, worker, family/accountant, vet, support admin, platform admin.
Constraints:
- App authorization first; RLS as defense in depth.
- Add test case per policy.
- Enable RLS on new tables before legacy tables.
```

### Phase 7 — Retire Express

```text
Read: REPO_PLAN.md, docs/architecture.md

Phase 7: cutover and cleanup.
Task: [e.g. point mobile to FastAPI / remove Express mortality route]

Constraints:
- Express read-only until parity tests pass.
- Remove legacy packages last.
- Do not delete web app.
```

---

## Task-specific templates

### Mobile — local event + outbox

```text
Read: system_design.md, MVP.md
Existing code: apps/mobile/src/core/sync/, apps/mobile/src/modules/mortality/

Task: [e.g. write mortality event to local DB and enqueue sync outbox]

Follow module pattern:
  mortality.model.ts
  mortality.service.ts
  mortality.sync.ts
  mortality.types.ts

Constraints:
- Write locally first; no network required for UI update.
- Use idempotencyKey on every outbox entry.
- Do not add new dependencies without asking.
```

### Mobile — sync engine

```text
Read: system_design.md (Sync operation envelope section), MVP.md
Existing code: apps/mobile/src/core/sync/SyncEngine.ts, SyncOutbox.ts, SyncCursor.ts

Task: [e.g. push pending outbox items with exponential backoff]

Constraints:
- Mutex / single-flight sync.
- Handle sync rejections and store in sync_rejections.
- Retries must be safe (same idempotency key).
```

### Backend — module slice

```text
Read: system_design.md (Backend module template section)

Task: Implement modules/daily_ops/ [or specific submodule]

Structure:
  api/router.py          # HTTP only
  application/service.py # transaction orchestration
  domain/events.py       # pure rules, no DB
  infrastructure/repository.py
  infrastructure/sync_handler.py

Boundary:
  router → service → domain → repository → PostgreSQL + outbox

Do not put business logic in router.py.
```

### Backend — sync push handler

```text
Read: system_design.md (Event envelope + Sync operation envelope)

Task: POST /v1/sync/push handler for resource=[mortality-entry]

Validate:
- JWT identity (never trust client tenantId / actorUserId)
- idempotencyKey deduplication
- farm/batch scope permission

Write in one transaction:
1. immutable source event
2. domain event row
3. audit record
4. outbox event
```

### Backend — Celery worker task

```text
Read: system_design.md (Worker safety + Transactional outbox)

Task: [e.g. metrics:{batch_id}:{event_id} projection update]

Constraints:
- Idempotent task key: metrics:{batch_id}:{event_id}
- Mark outbox published after success.
- Failed tasks go to dead_letter queue with retry policy.
```

### Contract tests

```text
Read: system_design.md, REPO_PLAN.md
Target: packages/contracts/

Task: JSON fixtures for mortality.logged event and mortality-entry sync operation.

Include:
- valid minimal payload
- correction with supersedes_event_id
- invalid payload for rejection test
```

### Legacy Express fix (temporary only)

```text
Read: docs/architecture.md, REPO_PLAN.md

Task: [bug fix on existing Express route]

Constraints:
- This is legacy path; do not expand CRUD patterns.
- Do not add new mutable-log features that block migration.
- Note in comment or PR that FastAPI event path replaces this in Phase 3+.
```

---

## Minimal session starter (copy every time)

```text
@system_design.md @MVP.md @REPO_PLAN.md

Phase: [N]
Task: [one sentence]
Files: [paths]
Acceptance: [how I know it's done]
Out of scope: [AI, web farmer UI, feed, etc.]
```

---

## Example — full Phase 3 session

```text
@system_design.md @MVP.md @REPO_PLAN.md

Project: Murgi Mitra

Phase 3: mortality end-to-end (MVP gate).

Task: Implement FastAPI sync push handler for mortality-entry create
in packages/backend-core, wired from apps/api.

Generate:
- modules/daily_ops/application/commands.py (LogMortality)
- modules/daily_ops/infrastructure/repository.py
- modules/daily_ops/infrastructure/sync_handler.py
- modules/sync/api/router.py (POST /v1/sync/push partial)

Write path (single DB transaction):
farm_events → mortality_events → audit_log → outbox_events

Idempotency: dedupe by idempotencyKey from sync envelope.
Auth: derive tenant/user from JWT only.

Match mobile sync types in apps/mobile/src/modules/mortality/mortality.sync.ts.

Acceptance:
- Duplicate push returns same result, one event stored
- Correction creates new event with supersedes link
- batch_metrics updates via outbox → Celery (stub OK if marked TODO)

Out of scope: feed, weight, finance, AI, web dashboard changes, deleting Express.
Minimal diff. No unrelated refactors.
```

---

## Checklist before accepting Copilot output

- [ ] Matches current phase in `REPO_PLAN.md`
- [ ] Within scope in `MVP.md`
- [ ] Follows module boundaries in `system_design.md`
- [ ] Idempotent sync / outbox where writes occur
- [ ] No AI or out-of-scope features slipped in
- [ ] Files placed in target repo layout, not random paths
- [ ] Legacy Express not expanded unless explicitly a Phase 0 fix

---

## Related docs

| File | Role |
|---|---|
| `system_design.md` | Definitive architecture |
| `MVP.md` | V1 product scope and exit criteria |
| `REPO_PLAN.md` | Migration phases and target repo layout |
| `docs/architecture.md` | What runs today (legacy path) |
