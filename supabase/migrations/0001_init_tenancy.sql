-- =====================================================================
-- Poultry Intelligence Hub — 0001 Tenancy foundation
-- Organizations, profiles, memberships, devices, farms, sheds.
-- Conventions (see docs/DATA_MODEL.md, AGENTS.md):
--   * UUID primary keys, client-generatable offline (gen_random_uuid default).
--   * Every tenant row carries org_id; farm data reaches org via farm_id.
--   * created_at / updated_at on every table (TIMESTAMPTZ, UTC).
--   * Soft delete via deleted_at (NULL = live).
--   * Money is NEVER stored here; financial tables use integer paise.
-- RLS policies live in 0007_rls_policies.sql.
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";      -- case-insensitive email

-- ---------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------
create or replace function app_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type member_role as enum ('owner', 'manager', 'worker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flock_status as enum (
    'planned', 'placed', 'growing', 'ready_for_lifting',
    'partially_lifted', 'final_lifting', 'settlement',
    'completed', 'archived'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- organizations — tenant boundary (one org = one farm business)
-- ---------------------------------------------------------------------
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create trigger trg_organizations_updated
  before update on organizations
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- profiles — identity records mapped to Supabase auth.users
-- (auth.users is managed by Supabase; we mirror the id here)
-- ---------------------------------------------------------------------
create table profiles (
  id          uuid primary key,          -- == auth.uid()
  email       citext,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated
  before update on profiles
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- organization_memberships — role binding (one role per user per org)
-- ---------------------------------------------------------------------
create table organization_memberships (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null,             -- references auth.users(id)
  role        member_role not null default 'worker',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (org_id, user_id)
);
create index idx_memberships_user on organization_memberships(user_id);
create index idx_memberships_org  on organization_memberships(org_id);
create trigger trg_memberships_updated
  before update on organization_memberships
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- devices — multi-device tracking for offline sync
-- ---------------------------------------------------------------------
create table devices (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid,                      -- nullable: device survives user removal
  name        text,                      -- e.g. "Worker Phone"
  platform    text,                      -- android | ios
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_devices_org on devices(org_id);
create trigger trg_devices_updated
  before update on devices
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- farms — physical farm locations
-- ---------------------------------------------------------------------
create table farms (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  location    text,                      -- e.g. "Namakkal, Tamil Nadu"
  created_by  uuid,                      -- auth.users(id)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_farms_org on farms(org_id) where deleted_at is null;
create trigger trg_farms_updated
  before update on farms
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- sheds — houses within a farm
-- ---------------------------------------------------------------------
create table sheds (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  farm_id     uuid not null references farms(id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  capacity    integer check (capacity is null or capacity > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_sheds_farm on sheds(farm_id) where deleted_at is null;
create index idx_sheds_org  on sheds(org_id);
create trigger trg_sheds_updated
  before update on sheds
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- shed_assignments — which workers may access which sheds
-- ---------------------------------------------------------------------
create table shed_assignments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null,             -- auth.users(id)
  shed_id     uuid not null references sheds(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, shed_id)
);
create index idx_shed_assign_user on shed_assignments(user_id);
create index idx_shed_assign_shed on shed_assignments(shed_id);
