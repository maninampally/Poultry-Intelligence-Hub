-- =====================================================================
-- Poultry Intelligence Hub — 0008 Bootstrap & calculation helpers
-- SECURITY DEFINER bootstrap: a newly-signed-up user creates their org,
-- becomes its owner, and gets a first farm — atomically, bypassing the
-- "must already be a member" chicken-and-egg of the RLS insert policies.
-- =====================================================================

-- Create an organization + owner membership + first farm for the caller.
create or replace function app_bootstrap_org(
  p_org_name   text,
  p_farm_name  text default null,
  p_location   text default null
)
returns table (org_id uuid, farm_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_org   uuid;
  v_farm  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into organizations (name) values (p_org_name)
  returning id into v_org;

  insert into organization_memberships (org_id, user_id, role)
  values (v_org, v_uid, 'owner');

  if p_farm_name is not null then
    insert into farms (org_id, name, location, created_by)
    values (v_org, p_farm_name, p_location, v_uid)
    returning id into v_farm;
  end if;

  org_id := v_org;
  farm_id := v_farm;
  return next;
end;
$$;

-- ---------------------------------------------------------------------
-- Deterministic SQL calculation helpers (parity with Python analytics).
-- The authoritative calculation engine is apps/api analytics (Python,
-- tested). These SQL functions exist for server-side projection rebuild
-- and must use the SAME formulas.
-- ---------------------------------------------------------------------

-- Total mortality for a flock (sum of mortality_records, live rows only).
create or replace function app_flock_mortality(p_flock uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(count), 0)::integer
  from mortality_records
  where flock_id = p_flock and deleted_at is null;
$$;

-- Current live birds = placed - mortality.
create or replace function app_flock_current_birds(p_flock uuid)
returns integer
language sql
stable
as $$
  select coalesce(f.birds_placed, 0) - app_flock_mortality(p_flock)
  from flocks f where f.id = p_flock;
$$;

-- Total feed issued (kg) for a flock.
create or replace function app_flock_feed_kg(p_flock uuid)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    case kind
      when 'opening_balance' then quantity_kg
      when 'purchase'        then quantity_kg
      when 'adjustment_in'   then quantity_kg
      when 'issued'          then quantity_kg   -- feed consumed by birds
      else 0
    end
  ), 0)
  from feed_records
  where flock_id = p_flock and deleted_at is null;
$$;
