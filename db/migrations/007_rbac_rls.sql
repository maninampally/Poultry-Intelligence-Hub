-- Phase 6: Supabase tenant isolation and owner/worker authorization.
-- Supabase exposes auth.uid() from the authenticated JWT.

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'worker')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_memberships_user_idx
  ON public.tenant_memberships (user_id, tenant_id);

CREATE OR REPLACE FUNCTION public.has_tenant_access(target_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_farm_access(target_farm_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.farm_memberships
    WHERE farm_id = target_farm_id
      AND user_id = auth.uid()
  );
$$;

ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

ALTER TABLE app.farm_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.mortality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feed_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feed_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feed_inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.feed_stock_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.weight_sample_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.expense_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.sale_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.batch_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.batch_financial_summary ENABLE ROW LEVEL SECURITY;

ALTER TABLE internal.sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal.sync_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_memberships_self_policy ON public.tenant_memberships
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY tenants_member_policy ON public.tenants
  FOR SELECT USING (public.has_tenant_access(id));
CREATE POLICY farm_memberships_self_policy ON public.farm_memberships
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY farms_member_policy ON public.farms
  FOR ALL USING (public.has_farm_access(id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY sheds_farm_policy ON public.sheds
  FOR ALL USING (public.has_farm_access(farm_id))
  WITH CHECK (public.has_farm_access(farm_id));
CREATE POLICY batches_farm_policy ON public.batches
  FOR ALL USING (public.has_farm_access(farm_id))
  WITH CHECK (public.has_farm_access(farm_id));

CREATE POLICY farm_events_tenant_policy ON app.farm_events
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY mortality_events_scope_policy ON app.mortality_events
  FOR ALL USING (EXISTS (
    SELECT 1 FROM app.farm_events e
    WHERE e.id = event_id AND public.has_tenant_access(e.tenant_id)
  ));
CREATE POLICY feed_products_tenant_policy ON app.feed_products
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY feed_lots_tenant_policy ON app.feed_lots
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY feed_movements_tenant_policy ON app.feed_inventory_movements
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY feed_snapshots_tenant_policy ON app.feed_stock_snapshot
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY weight_events_tenant_policy ON app.weight_sample_events
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY expense_events_tenant_policy ON app.expense_events
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY sale_events_tenant_policy ON app.sale_events
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY batch_metrics_tenant_policy ON app.batch_metrics
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY financials_tenant_policy ON app.batch_financial_summary
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));

CREATE POLICY sync_operations_tenant_policy ON internal.sync_operations
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY sync_cursors_tenant_policy ON internal.sync_cursors
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));
CREATE POLICY audit_log_tenant_policy ON internal.audit_log
  FOR ALL USING (public.has_tenant_access(tenant_id))
  WITH CHECK (public.has_tenant_access(tenant_id));

-- Outbox rows are accessed by trusted worker connections, not client roles.
CREATE POLICY outbox_service_policy ON internal.outbox_events
  FOR ALL USING (current_user IN ('postgres', 'service_role'))
  WITH CHECK (current_user IN ('postgres', 'service_role'));
