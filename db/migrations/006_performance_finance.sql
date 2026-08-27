-- Phase 5: append-only performance and finance events.

CREATE TABLE IF NOT EXISTS app.weight_sample_events (
  event_id          UUID PRIMARY KEY REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  tenant_id         UUID NOT NULL,
  batch_id          UUID NOT NULL REFERENCES public.batches (id) ON DELETE RESTRICT,
  shed_id           UUID NOT NULL REFERENCES public.sheds (id) ON DELETE RESTRICT,
  sample_size       INTEGER NOT NULL CHECK (sample_size > 0),
  total_weight_kg   NUMERIC(12, 3) NOT NULL CHECK (total_weight_kg >= 0),
  average_weight_kg NUMERIC(12, 3) NOT NULL CHECK (average_weight_kg >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app.expense_events (
  event_id      UUID PRIMARY KEY REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  tenant_id     UUID NOT NULL,
  farm_id       UUID NOT NULL REFERENCES public.farms (id) ON DELETE RESTRICT,
  batch_id      UUID REFERENCES public.batches (id) ON DELETE RESTRICT,
  category      TEXT NOT NULL,
  amount        NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  occurred_at   TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app.sale_events (
  event_id        UUID PRIMARY KEY REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  tenant_id       UUID NOT NULL,
  farm_id         UUID NOT NULL REFERENCES public.farms (id) ON DELETE RESTRICT,
  batch_id        UUID REFERENCES public.batches (id) ON DELETE RESTRICT,
  birds_sold      INTEGER NOT NULL CHECK (birds_sold > 0),
  total_weight_kg NUMERIC(12, 3) NOT NULL CHECK (total_weight_kg > 0),
  price_per_kg    NUMERIC(12, 2) NOT NULL CHECK (price_per_kg >= 0),
  buyer           TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE app.batch_metrics
  ADD COLUMN IF NOT EXISTS total_feed_kg NUMERIC(14, 3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_weight_kg NUMERIC(12, 3),
  ADD COLUMN IF NOT EXISTS fcr NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS calculation_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS projection_status TEXT NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS last_processed_event_id UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS last_calculated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS app.batch_financial_summary (
  batch_id       UUID PRIMARY KEY REFERENCES public.batches (id) ON DELETE CASCADE,
  tenant_id      UUID NOT NULL,
  total_expense  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_revenue  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  margin         NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost_per_bird  NUMERIC(14, 4),
  calculation_version INTEGER NOT NULL DEFAULT 1,
  projection_status TEXT NOT NULL DEFAULT 'current',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
