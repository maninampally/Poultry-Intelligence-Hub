-- Murgi Mitra initial schema.
-- Matches packages/db/queries/** column usage. Safe to re-run (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Core hierarchy: farms → sheds → batches
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS farms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  owner_name  TEXT NOT NULL,
  state       TEXT NOT NULL,
  district    TEXT NOT NULL,
  village     TEXT,
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sheds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id     UUID NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  capacity    INTEGER NOT NULL CHECK (capacity > 0),
  area_sqft   DOUBLE PRECISION,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sheds_farm_id_idx ON sheds (farm_id);

CREATE TABLE IF NOT EXISTS batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code        TEXT NOT NULL UNIQUE,
  farm_id           UUID NOT NULL REFERENCES farms (id) ON DELETE CASCADE,
  shed_id           UUID NOT NULL REFERENCES sheds (id) ON DELETE RESTRICT,
  start_date        TIMESTAMPTZ NOT NULL,
  target_sale_date  TIMESTAMPTZ,
  placement_count   INTEGER NOT NULL CHECK (placement_count > 0),
  chick_supplier    TEXT NOT NULL,
  breed             TEXT NOT NULL,
  contract_type     TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS batches_farm_id_idx ON batches (farm_id);
CREATE INDEX IF NOT EXISTS batches_shed_id_idx ON batches (shed_id);
CREATE INDEX IF NOT EXISTS batches_status_idx ON batches (status);

-- ---------------------------------------------------------------------------
-- Daily / operational logs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mortality_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  shed_id     UUID NOT NULL REFERENCES sheds (id) ON DELETE RESTRICT,
  date        TIMESTAMPTZ NOT NULL,
  shift       TEXT NOT NULL,
  count       INTEGER NOT NULL CHECK (count >= 0),
  cause       TEXT,
  notes       TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS mortality_logs_batch_id_idx ON mortality_logs (batch_id);
CREATE INDEX IF NOT EXISTS mortality_logs_date_idx ON mortality_logs (date);

CREATE TABLE IF NOT EXISTS feed_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id     UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  shed_id      UUID NOT NULL REFERENCES sheds (id) ON DELETE RESTRICT,
  date         TIMESTAMPTZ NOT NULL,
  shift        TEXT NOT NULL,
  feed_type    TEXT NOT NULL,
  feed_brand   TEXT,
  bag_number   TEXT,
  kg_given     DOUBLE PRECISION NOT NULL CHECK (kg_given >= 0),
  kg_returned  DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (kg_returned >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS feed_logs_batch_id_idx ON feed_logs (batch_id);
CREATE INDEX IF NOT EXISTS feed_logs_date_idx ON feed_logs (date);

CREATE TABLE IF NOT EXISTS weight_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  shed_id          UUID NOT NULL REFERENCES sheds (id) ON DELETE RESTRICT,
  date             TIMESTAMPTZ NOT NULL,
  sample_size      INTEGER NOT NULL CHECK (sample_size > 0),
  total_weight_kg  DOUBLE PRECISION NOT NULL CHECK (total_weight_kg >= 0),
  avg_weight_kg    DOUBLE PRECISION NOT NULL CHECK (avg_weight_kg >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS weight_logs_batch_id_idx ON weight_logs (batch_id);
CREATE INDEX IF NOT EXISTS weight_logs_date_idx ON weight_logs (date);

CREATE TABLE IF NOT EXISTS cost_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id      UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  sub_category  TEXT,
  amount        DOUBLE PRECISION NOT NULL,
  quantity      DOUBLE PRECISION,
  unit          TEXT,
  date          TIMESTAMPTZ NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS cost_entries_batch_id_idx ON cost_entries (batch_id);
CREATE INDEX IF NOT EXISTS cost_entries_date_idx ON cost_entries (date);

CREATE TABLE IF NOT EXISTS vaccination_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  vaccine_name     TEXT NOT NULL,
  dose_date        TIMESTAMPTZ NOT NULL,
  dose_number      INTEGER NOT NULL DEFAULT 1,
  cost             DOUBLE PRECISION,
  batch_no         TEXT,
  route            TEXT,
  administered_by  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS vaccination_logs_batch_id_idx ON vaccination_logs (batch_id);
CREATE INDEX IF NOT EXISTS vaccination_logs_dose_date_idx ON vaccination_logs (dose_date);

CREATE TABLE IF NOT EXISTS sale_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id         UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  sale_date        TIMESTAMPTZ NOT NULL,
  birds_sold       INTEGER NOT NULL CHECK (birds_sold > 0),
  total_weight_kg  DOUBLE PRECISION NOT NULL CHECK (total_weight_kg > 0),
  price_per_kg     DOUBLE PRECISION NOT NULL CHECK (price_per_kg >= 0),
  buyer            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS sale_records_batch_id_idx ON sale_records (batch_id);
CREATE INDEX IF NOT EXISTS sale_records_sale_date_idx ON sale_records (sale_date);

CREATE TABLE IF NOT EXISTS alert_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  alert_type      TEXT NOT NULL,
  severity        TEXT NOT NULL,
  message_en      TEXT NOT NULL,
  message_hi      TEXT,
  recommendation  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS alert_logs_batch_id_idx ON alert_logs (batch_id);
CREATE INDEX IF NOT EXISTS alert_logs_created_at_idx ON alert_logs (created_at);
CREATE INDEX IF NOT EXISTS alert_logs_resolved_at_idx ON alert_logs (resolved_at);
