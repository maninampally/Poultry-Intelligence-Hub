-- Phase 3: tenant and farm membership scope used by sync authorization.

CREATE TABLE IF NOT EXISTS public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.farm_memberships (
  farm_id     UUID NOT NULL REFERENCES public.farms (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'worker')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (farm_id, user_id)
);

ALTER TABLE public.farms
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS farms_tenant_idx ON public.farms (tenant_id);
CREATE INDEX IF NOT EXISTS farm_memberships_user_idx
  ON public.farm_memberships (user_id, tenant_id, farm_id);
