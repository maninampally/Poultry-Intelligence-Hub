-- Phase 4: append-only feed inventory and usage ledger.

CREATE TABLE IF NOT EXISTS app.feed_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'kg',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS app.feed_lots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  product_id    UUID NOT NULL REFERENCES app.feed_products (id) ON DELETE RESTRICT,
  lot_code      TEXT,
  received_at   TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS feed_lots_product_idx ON app.feed_lots (product_id, received_at);

CREATE TABLE IF NOT EXISTS app.feed_inventory_movements (
  event_id       UUID PRIMARY KEY REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  tenant_id      UUID NOT NULL,
  farm_id        UUID NOT NULL REFERENCES public.farms (id) ON DELETE RESTRICT,
  product_id     UUID NOT NULL REFERENCES app.feed_products (id) ON DELETE RESTRICT,
  lot_id         UUID REFERENCES app.feed_lots (id) ON DELETE RESTRICT,
  movement_type  TEXT NOT NULL CHECK (movement_type IN ('receipt', 'usage', 'wastage')),
  quantity_kg    NUMERIC(12, 3) NOT NULL CHECK (quantity_kg > 0),
  batch_id       UUID REFERENCES public.batches (id) ON DELETE RESTRICT,
  shed_id        UUID REFERENCES public.sheds (id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS feed_movements_stock_idx
  ON app.feed_inventory_movements (tenant_id, farm_id, product_id, created_at);
CREATE INDEX IF NOT EXISTS feed_movements_batch_idx
  ON app.feed_inventory_movements (batch_id, created_at);

CREATE TABLE IF NOT EXISTS app.feed_stock_snapshot (
  tenant_id       UUID NOT NULL,
  farm_id         UUID NOT NULL REFERENCES public.farms (id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES app.feed_products (id) ON DELETE CASCADE,
  stock_kg        NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (stock_kg >= 0),
  last_event_id   UUID REFERENCES app.farm_events (id) ON DELETE RESTRICT,
  calculation_version INTEGER NOT NULL DEFAULT 1,
  projection_status TEXT NOT NULL DEFAULT 'current'
                    CHECK (projection_status IN ('pending', 'current', 'failed')),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, farm_id, product_id)
);
