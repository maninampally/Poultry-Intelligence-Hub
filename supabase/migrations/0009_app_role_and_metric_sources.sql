-- =====================================================================
-- Poultry Intelligence Hub — 0009 App role + metric source alignment
-- Phase 0: API/worker should use a non-BYPASSRLS role so RLS is real.
-- Metrics helpers must include daily_records (primary farmer write path).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Application role (no BYPASSRLS). Password is NOT set here — the local
-- migrate entrypoint (or ops) runs: ALTER ROLE pih_app PASSWORD '...';
-- Never commit real passwords into SQL.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pih_app') then
    create role pih_app login nosuperuser nocreatedb nocreaterole nobypassrls;
  end if;
end
$$;

do $$
begin
  execute format('grant connect on database %I to pih_app', current_database());
end
$$;
grant usage on schema public to pih_app;

grant select, insert, update, delete on all tables in schema public to pih_app;
grant usage, select on all sequences in schema public to pih_app;
grant execute on all functions in schema public to pih_app;

alter default privileges in schema public
  grant select, insert, update, delete on tables to pih_app;
alter default privileges in schema public
  grant usage, select on sequences to pih_app;
alter default privileges in schema public
  grant execute on functions to pih_app;

-- ---------------------------------------------------------------------
-- Mortality = dedicated mortality_records + daily round deaths.
-- Avoid double-count later by treating daily_records as the round summary
-- and mortality_records as extra/event detail; both contribute until a
-- dual-write policy is enforced in Phase 1.
-- ---------------------------------------------------------------------
create or replace function app_flock_mortality(p_flock uuid)
returns integer
language sql
stable
as $$
  select (
    coalesce((
      select sum(count)::integer
      from mortality_records
      where flock_id = p_flock and deleted_at is null
    ), 0)
    +
    coalesce((
      select sum(deaths)::integer
      from daily_records
      where flock_id = p_flock and deleted_at is null and deaths is not null
    ), 0)
  )::integer;
$$;

-- Feed consumed ≈ feed_records 'issued' (+ stock ins for inventory views)
-- plus daily_records.feed_kg (farmer's daily entry).
create or replace function app_flock_feed_kg(p_flock uuid)
returns numeric
language sql
stable
as $$
  select (
    coalesce((
      select sum(
        case kind
          when 'opening_balance' then quantity_kg
          when 'purchase'        then quantity_kg
          when 'adjustment_in'   then quantity_kg
          when 'issued'          then quantity_kg
          else 0
        end
      )
      from feed_records
      where flock_id = p_flock and deleted_at is null
    ), 0)
    +
    coalesce((
      select sum(feed_kg)
      from daily_records
      where flock_id = p_flock and deleted_at is null and feed_kg is not null
    ), 0)
  );
$$;
