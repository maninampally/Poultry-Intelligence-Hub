-- =====================================================================
-- Poultry Intelligence Hub — 0002 Flocks & daily operations
-- Flock lifecycle, status history, daily rounds, and the append-only
-- event tables (mortality, feed, water, weight, medicine, vaccination,
-- health, expenses).
--
-- Design notes:
--   * Facts are append-friendly. Daily rounds are one-per-flock-per-day
--     (upsert on same date). Granular event tables allow multiple rows.
--   * occurred_date is DATE (groups by day); created_at is TIMESTAMPTZ.
--   * NULL numeric = "not recorded"; 0 = "recorded as zero".
--   * Money (expenses) stored as integer paise, NEVER float.
--   * Every row carries org_id (tenant) and flock_id/farm linkage.
-- =====================================================================

-- ---------------------------------------------------------------------
-- flocks — the batch lifecycle entity
-- ---------------------------------------------------------------------
create table flocks (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  farm_id         uuid not null references farms(id) on delete cascade,
  shed_id         uuid references sheds(id) on delete set null,
  name            text not null,                 -- e.g. "Flock 08" / "B-2026-08-01"
  status          flock_status not null default 'planned',
  placed_on       date,                          -- placement date (null until placed)
  birds_placed    integer check (birds_placed is null or birds_placed > 0),
  breed           text,
  chick_source    text,
  capacity        integer check (capacity is null or capacity > 0),
  expected_lift_from date,                        -- planned lifting window start
  expected_lift_to   date,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index idx_flocks_farm   on flocks(farm_id) where deleted_at is null;
create index idx_flocks_org     on flocks(org_id);
create index idx_flocks_status  on flocks(org_id, status) where deleted_at is null;
create trigger trg_flocks_updated
  before update on flocks
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- flock_status_history — append-only lifecycle transition log
-- ---------------------------------------------------------------------
create table flock_status_history (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  flock_id    uuid not null references flocks(id) on delete cascade,
  from_status flock_status,
  to_status   flock_status not null,
  changed_by  uuid,
  note        text,
  created_at  timestamptz not null default now()
);
create index idx_status_hist_flock on flock_status_history(flock_id);

-- ---------------------------------------------------------------------
-- daily_records — one summary row per flock per day (upsert on date)
-- The 5-second entry: feed, water, deaths, optional weight.
-- ---------------------------------------------------------------------
create table daily_records (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  flock_id        uuid not null references flocks(id) on delete cascade,
  record_date     date not null,
  feed_kg         numeric(10,3) check (feed_kg is null or feed_kg >= 0),
  water_l         numeric(10,3) check (water_l is null or water_l >= 0),
  deaths          integer       check (deaths is null or deaths >= 0),
  avg_weight_kg   numeric(8,4)  check (avg_weight_kg is null or avg_weight_kg >= 0),
  notes           text,
  photo_uri       text,
  is_complete     boolean not null default false,  -- feed + deaths both recorded
  created_by      uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (flock_id, record_date)
);
create index idx_daily_flock_date on daily_records(flock_id, record_date desc)
  where deleted_at is null;
create index idx_daily_org on daily_records(org_id);
create trigger trg_daily_updated
  before update on daily_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- mortality_records — append-only death events
-- ---------------------------------------------------------------------
create table mortality_records (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  flock_id    uuid not null references flocks(id) on delete cascade,
  occurred_date date not null,
  count       integer not null check (count >= 0),
  reason      text,
  photo_uri   text,
  created_by  uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_mortality_flock on mortality_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_mortality_updated
  before update on mortality_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- feed_records — feed stock / issue movements
-- ---------------------------------------------------------------------
do $$ begin
  create type feed_kind as enum (
    'opening_balance', 'purchase', 'issued', 'wastage',
    'adjustment_in', 'adjustment_out'
  );
exception when duplicate_object then null; end $$;

create table feed_records (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  flock_id    uuid not null references flocks(id) on delete cascade,
  occurred_date date not null,
  kind        feed_kind not null default 'issued',
  quantity_kg numeric(10,3) not null check (quantity_kg >= 0),
  notes       text,
  created_by  uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_feed_flock on feed_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_feed_updated
  before update on feed_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- water_records — daily water consumption
-- ---------------------------------------------------------------------
create table water_records (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  flock_id    uuid not null references flocks(id) on delete cascade,
  occurred_date date not null,
  quantity_l  numeric(10,3) not null check (quantity_l >= 0),
  notes       text,
  created_by  uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_water_flock on water_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_water_updated
  before update on water_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- weight_records — sample weighing (store sample avg + size)
-- ---------------------------------------------------------------------
create table weight_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  flock_id      uuid not null references flocks(id) on delete cascade,
  occurred_date date not null,
  avg_weight_kg numeric(8,4) not null check (avg_weight_kg >= 0),
  sample_size   integer check (sample_size is null or sample_size > 0),
  notes         text,
  created_by    uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_weight_flock on weight_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_weight_updated
  before update on weight_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- medicines (catalog) + medicine_records + vaccinations
-- ---------------------------------------------------------------------
create table medicines (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  unit        text,                      -- ml, g, dose
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_medicines_org on medicines(org_id) where deleted_at is null;
create trigger trg_medicines_updated
  before update on medicines
  for each row execute function app_set_updated_at();

create table medicine_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  flock_id      uuid not null references flocks(id) on delete cascade,
  medicine_id   uuid references medicines(id) on delete set null,
  occurred_date date not null,
  medicine_name text,                      -- denormalized fallback
  dosage        text,
  quantity      numeric(10,3) check (quantity is null or quantity >= 0),
  unit          text,
  photo_uri     text,
  notes         text,
  created_by    uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_medrec_flock on medicine_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_medrec_updated
  before update on medicine_records
  for each row execute function app_set_updated_at();

create table vaccination_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  flock_id      uuid not null references flocks(id) on delete cascade,
  occurred_date date,                      -- null = scheduled, not yet given
  scheduled_date date,
  vaccine_name  text not null,
  method        text,                      -- water, spray, injection
  given         boolean not null default false,
  notes         text,
  created_by    uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_vacc_flock on vaccination_records(flock_id)
  where deleted_at is null;
create trigger trg_vacc_updated
  before update on vaccination_records
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- health_records — observations (append-only)
-- ---------------------------------------------------------------------
create table health_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  flock_id      uuid not null references flocks(id) on delete cascade,
  occurred_date date not null,
  observation   text not null,
  severity      text,                      -- info | watch | act
  photo_uri     text,
  created_by    uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_health_flock on health_records(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_health_updated
  before update on health_records
  for each row execute function app_set_updated_at();
