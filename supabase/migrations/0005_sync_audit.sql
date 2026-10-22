-- =====================================================================
-- Poultry Intelligence Hub — 0005 Sync primitives & audit log
-- Idempotent offline-first sync log, per-device/table pull cursors,
-- and an append-only audit trail for privileged actions.
-- =====================================================================

-- ---------------------------------------------------------------------
-- sync_operations — idempotent push log (server side)
--   Each local change carries an idempotency_key. Re-pushing the same
--   key is a no-op (UNIQUE), making retries safe.
-- ---------------------------------------------------------------------
do $$ begin
  create type sync_op as enum ('insert', 'update', 'upsert', 'delete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sync_status as enum ('pending', 'synced', 'conflict', 'failed');
exception when duplicate_object then null; end $$;

create table sync_operations (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations(id) on delete cascade,
  device_id        uuid references devices(id) on delete set null,
  idempotency_key  text not null,
  table_name       text not null,
  operation        sync_op not null,
  record_id        uuid not null,
  data             jsonb not null,
  status           sync_status not null default 'synced',
  error_message    text,
  created_at       timestamptz not null default now(),
  unique (org_id, device_id, idempotency_key)
);
create index idx_syncops_org on sync_operations(org_id, created_at desc);

-- ---------------------------------------------------------------------
-- sync_cursors — per-device per-table delta pull position
-- ---------------------------------------------------------------------
create table sync_cursors (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  device_id      uuid not null references devices(id) on delete cascade,
  table_name     text not null,
  last_pulled_at timestamptz not null default to_timestamp(0),
  unique (device_id, table_name)
);
create index idx_synccursor_device on sync_cursors(device_id);

-- ---------------------------------------------------------------------
-- audit_log — privileged / sensitive actions (append-only)
-- ---------------------------------------------------------------------
create table audit_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid,
  action      text not null,             -- flock_closed | settlement_confirmed | member_added ...
  table_name  text,
  record_id   uuid,
  changes     jsonb,                     -- before/after
  created_at  timestamptz not null default now()
);
create index idx_audit_org on audit_log(org_id, created_at desc);
