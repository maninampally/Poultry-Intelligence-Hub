-- =====================================================================
-- Poultry Intelligence Hub — 0011 Projection write helpers (Phase 2)
-- Worker uses pih_app (no BYPASSRLS). These SECURITY DEFINER helpers
-- upsert flock_metrics and insert notifications without needing a
-- manager JWT on the worker process.
-- =====================================================================

create or replace function app_upsert_flock_metrics(
  p_flock_id          uuid,
  p_org_id            uuid,
  p_age_days          integer,
  p_current_birds     integer,
  p_total_mortality   integer,
  p_mortality_pct     numeric,
  p_livability_pct    numeric,
  p_avg_weight_kg     numeric,
  p_total_feed_kg     numeric,
  p_provisional_fcr   numeric,
  p_feed_runway_days  integer,
  p_completeness_pct  integer,
  p_last_record_date  date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into flock_metrics (
    flock_id, org_id, age_days, current_birds, total_mortality,
    mortality_pct, livability_pct, avg_weight_kg, total_feed_kg,
    provisional_fcr, feed_runway_days, completeness_pct,
    last_record_date, updated_at
  ) values (
    p_flock_id, p_org_id, p_age_days, p_current_birds, p_total_mortality,
    p_mortality_pct, p_livability_pct, p_avg_weight_kg, p_total_feed_kg,
    p_provisional_fcr, p_feed_runway_days, p_completeness_pct,
    p_last_record_date, now()
  )
  on conflict (flock_id) do update set
    org_id = excluded.org_id,
    age_days = excluded.age_days,
    current_birds = excluded.current_birds,
    total_mortality = excluded.total_mortality,
    mortality_pct = excluded.mortality_pct,
    livability_pct = excluded.livability_pct,
    avg_weight_kg = excluded.avg_weight_kg,
    total_feed_kg = excluded.total_feed_kg,
    provisional_fcr = excluded.provisional_fcr,
    feed_runway_days = excluded.feed_runway_days,
    completeness_pct = excluded.completeness_pct,
    last_record_date = excluded.last_record_date,
    updated_at = now();
end;
$$;

create or replace function app_insert_notification(
  p_org_id   uuid,
  p_farm_id  uuid,
  p_flock_id uuid,
  p_kind     text,
  p_severity text,
  p_title    text,
  p_body     text,
  p_action   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into notifications (
    org_id, farm_id, flock_id, kind, severity, title, body, action
  ) values (
    p_org_id, p_farm_id, p_flock_id, p_kind, p_severity, p_title, p_body, p_action
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function app_upsert_flock_metrics(
  uuid, uuid, integer, integer, integer, numeric, numeric, numeric,
  numeric, numeric, integer, integer, date
) to pih_app;

grant execute on function app_insert_notification(
  uuid, uuid, uuid, text, text, text, text, text
) to pih_app;
