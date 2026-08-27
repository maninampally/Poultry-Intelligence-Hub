-- Phase 2: event ledger, sync, audit, and outbox foundations.
-- Legacy public.*_logs tables remain unchanged and are not replaced here.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS internal;
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS app.farm_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type         TEXT NOT NULL,
  schema_version     INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  tenant_id          UUID,
  farm_id            UUID NOT NULL REFERENCES public.farms (id) ON DELETE RESTRICT,
  shed_id            UUID REFERENCES public.sheds (id) ON DELETE RESTRICT,
  batch_id           UUID REFERENCES public.batches (id) ON DELETE RESTRICT,
  occurred_at        TIMESTAMPTZ NOT NULL,
  client_occurred_at TIMESTAMPTZ,
  recorded_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id      UUID,
  device_id          UUID,
  supersedes_event_id UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS farm_events_farm_idx
  ON app.farm_events (farm_id, occurred_at);
CREATE INDEX IF NOT EXISTS farm_events_batch_idx
  ON app.farm_events (batch_id, occurred_at);
CREATE INDEX IF NOT EXISTS farm_events_tenant_idx
  ON app.farm_events (tenant_id, occurred_at);
CREATE INDEX IF NOT EXISTS farm_events_type_idx
  ON app.farm_events (event_type, occurred_at);

CREATE TABLE IF NOT EXISTS app.mortality_events (
  event_id       UUID PRIMARY KEY REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  batch_id       UUID NOT NULL REFERENCES public.batches (id) ON DELETE RESTRICT,
  shed_id        UUID NOT NULL REFERENCES public.sheds (id) ON DELETE RESTRICT,
  count          INTEGER NOT NULL CHECK (count >= 0),
  shift          TEXT NOT NULL,
  cause          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS mortality_events_batch_idx
  ON app.mortality_events (batch_id, created_at);

CREATE TABLE IF NOT EXISTS internal.sync_operations (
  operation_id       UUID PRIMARY KEY,
  idempotency_key    TEXT NOT NULL UNIQUE,
  resource           TEXT NOT NULL,
  action             TEXT NOT NULL,
  entity_id          UUID NOT NULL,
  tenant_id          UUID,
  actor_user_id      UUID,
  base_version       INTEGER,
  occurred_at        TIMESTAMPTZ NOT NULL,
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'rejected')),
  rejection_code     TEXT,
  rejection_message  TEXT,
  event_id           UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sync_operations_status_idx
  ON internal.sync_operations (status, created_at);
CREATE INDEX IF NOT EXISTS sync_operations_entity_idx
  ON internal.sync_operations (entity_id, created_at);

CREATE TABLE IF NOT EXISTS internal.sync_cursors (
  device_id       UUID NOT NULL,
  tenant_id       UUID,
  cursor_value    BIGINT NOT NULL DEFAULT 0 CHECK (cursor_value >= 0),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (device_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS internal.outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL UNIQUE REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  topic           TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'published', 'failed')),
  attempts        INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at    TIMESTAMPTZ,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS outbox_events_ready_idx
  ON internal.outbox_events (status, available_at);

CREATE TABLE IF NOT EXISTS internal.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID,
  actor_user_id   UUID,
  action          TEXT NOT NULL,
  resource        TEXT NOT NULL,
  resource_id     UUID,
  event_id        UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_idx
  ON internal.audit_log (tenant_id, created_at);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx
  ON internal.audit_log (resource, resource_id, created_at);
