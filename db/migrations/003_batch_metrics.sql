-- Phase 3: rebuildable mortality projection.

CREATE TABLE IF NOT EXISTS app.batch_metrics (
  batch_id                  UUID PRIMARY KEY REFERENCES public.batches (id) ON DELETE CASCADE,
  tenant_id                 UUID,
  placement_count           INTEGER NOT NULL CHECK (placement_count > 0),
  cumulative_mortality      INTEGER NOT NULL DEFAULT 0 CHECK (cumulative_mortality >= 0),
  live_bird_count            INTEGER NOT NULL CHECK (live_bird_count >= 0),
  mortality_percent          NUMERIC(7, 4) NOT NULL DEFAULT 0,
  last_processed_event_id    UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  calculation_version        INTEGER NOT NULL DEFAULT 1,
  projection_status          TEXT NOT NULL DEFAULT 'current'
                             CHECK (projection_status IN ('pending', 'current', 'failed')),
  last_calculated_at         TIMESTAMPTZ,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS batch_metrics_tenant_idx
  ON app.batch_metrics (tenant_id, batch_id);
