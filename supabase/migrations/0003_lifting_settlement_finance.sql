-- =====================================================================
-- Poultry Intelligence Hub — 0003 Lifting, settlement & finance
-- Counterparties (buyers/integrators), flock agreements + rules,
-- chick placements, feed receipts/returns, lifting events, settlements
-- and settlement lines, expenses.
--
-- MONEY RULE (AGENTS.md #7): all monetary amounts are stored as
-- integer paise (bigint). ₹1,23,456.78 == 12345678 paise. Formatting
-- for display is a frontend concern. NEVER store rupees as float.
--
-- Rates: paise_per_kg is paise per kilogram (integer).
-- Weights: kilograms as numeric. Counts: integer.
--
-- These tables are FINANCE/SETTLEMENT and are blocked for the worker
-- role via RLS (see 0007_rls_policies.sql).
-- =====================================================================

-- ---------------------------------------------------------------------
-- counterparties — buyers / integrators / suppliers
-- ---------------------------------------------------------------------
do $$ begin
  create type counterparty_kind as enum ('integrator', 'buyer', 'chick_supplier', 'feed_supplier', 'other');
exception when duplicate_object then null; end $$;

create table counterparties (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  kind        counterparty_kind not null default 'buyer',
  phone       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index idx_counterparties_org on counterparties(org_id) where deleted_at is null;
create trigger trg_counterparties_updated
  before update on counterparties
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- flock_agreements — contract vs independent terms per flock
-- ---------------------------------------------------------------------
do $$ begin
  create type agreement_kind as enum ('independent', 'contract');
exception when duplicate_object then null; end $$;

do $$ begin
  -- which FCR formula a contract uses; selectable per agreement
  create type fcr_formula as enum ('feed_div_liveweight', 'feed_div_gain');
exception when duplicate_object then null; end $$;

create table flock_agreements (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references organizations(id) on delete cascade,
  flock_id           uuid not null references flocks(id) on delete cascade,
  counterparty_id    uuid references counterparties(id) on delete set null,
  kind               agreement_kind not null default 'independent',
  -- Contract base growing charge, paise per bird or per kg (interpretation
  -- governed by base_charge_basis).
  base_charge_paise  bigint check (base_charge_paise is null or base_charge_paise >= 0),
  base_charge_basis  text,               -- 'per_bird' | 'per_kg_live'
  fcr_formula        fcr_formula not null default 'feed_div_liveweight',
  -- Independent sale rate, paise per kg live weight.
  rate_paise_per_kg  bigint check (rate_paise_per_kg is null or rate_paise_per_kg >= 0),
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index idx_agreements_flock on flock_agreements(flock_id) where deleted_at is null;
create trigger trg_agreements_updated
  before update on flock_agreements
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- agreement_rules — FCR / mortality bonus & penalty bands (contract)
--   PLACEHOLDER STRUCTURE. Real incentive rules come from DECISIONS.md
--   (BUILD_GUIDE Phase 0/6). Do not invent incentive values in prod.
-- ---------------------------------------------------------------------
do $$ begin
  create type rule_metric as enum ('fcr', 'mortality_pct', 'avg_weight');
exception when duplicate_object then null; end $$;

create table agreement_rules (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  agreement_id   uuid not null references flock_agreements(id) on delete cascade,
  metric         rule_metric not null,
  -- Band: when metric is within [lower, upper), apply adjustment.
  lower_bound    numeric(12,4),
  upper_bound    numeric(12,4),
  -- Adjustment to settlement, paise per bird (positive = bonus).
  adjust_paise_per_bird bigint not null default 0,
  description    text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_rules_agreement on agreement_rules(agreement_id, sort_order);
create trigger trg_rules_updated
  before update on agreement_rules
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- chick_placements — integrator billed count/weight vs farmer count
-- ---------------------------------------------------------------------
create table chick_placements (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  flock_id          uuid not null references flocks(id) on delete cascade,
  counterparty_id   uuid references counterparties(id) on delete set null,
  occurred_date     date not null,
  billed_count      integer check (billed_count is null or billed_count >= 0),
  farmer_count      integer check (farmer_count is null or farmer_count >= 0),
  billed_amount_paise bigint check (billed_amount_paise is null or billed_amount_paise >= 0),
  slip_photo_uri    text,
  notes             text,
  created_by        uuid,
  source_device_id  uuid references devices(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index idx_placements_flock on chick_placements(flock_id) where deleted_at is null;
create trigger trg_placements_updated
  before update on chick_placements
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- feed_receipts / feed_returns — integrator billed vs farmer received
-- ---------------------------------------------------------------------
create table feed_receipts (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  flock_id          uuid not null references flocks(id) on delete cascade,
  counterparty_id   uuid references counterparties(id) on delete set null,
  occurred_date     date not null,
  billed_qty_kg     numeric(10,3) check (billed_qty_kg is null or billed_qty_kg >= 0),
  farmer_qty_kg     numeric(10,3) check (farmer_qty_kg is null or farmer_qty_kg >= 0),
  billed_amount_paise bigint check (billed_amount_paise is null or billed_amount_paise >= 0),
  slip_photo_uri    text,
  notes             text,
  created_by        uuid,
  source_device_id  uuid references devices(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index idx_feedrcpt_flock on feed_receipts(flock_id) where deleted_at is null;
create trigger trg_feedrcpt_updated
  before update on feed_receipts
  for each row execute function app_set_updated_at();

create table feed_returns (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  flock_id          uuid not null references flocks(id) on delete cascade,
  occurred_date     date not null,
  qty_kg            numeric(10,3) not null check (qty_kg >= 0),
  notes             text,
  created_by        uuid,
  source_device_id  uuid references devices(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index idx_feedret_flock on feed_returns(flock_id) where deleted_at is null;
create trigger trg_feedret_updated
  before update on feed_returns
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- lifting_events — birds collected for sale/processing (multiple/flock)
-- ---------------------------------------------------------------------
create table lifting_events (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  flock_id          uuid not null references flocks(id) on delete cascade,
  counterparty_id   uuid references counterparties(id) on delete set null,
  occurred_date     date not null,
  vehicle_number    text,
  birds_lifted      integer not null check (birds_lifted >= 0),
  avg_weight_kg     numeric(8,4) check (avg_weight_kg is null or avg_weight_kg >= 0),
  total_weight_kg   numeric(12,4) check (total_weight_kg is null or total_weight_kg >= 0),
  rate_paise_per_kg bigint check (rate_paise_per_kg is null or rate_paise_per_kg >= 0),
  gross_amount_paise bigint check (gross_amount_paise is null or gross_amount_paise >= 0),
  adjustments_paise bigint not null default 0,
  net_amount_paise  bigint,
  shrinkage_kg      numeric(10,4),
  weighed_by        text,
  slip_photo_uri    text,
  is_final          boolean not null default false,
  payment_status    text not null default 'pending',  -- pending | partial | paid
  notes             text,
  created_by        uuid,
  source_device_id  uuid references devices(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index idx_lifting_flock on lifting_events(flock_id, occurred_date)
  where deleted_at is null;
create trigger trg_lifting_updated
  before update on lifting_events
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- settlements — one per flock closeout; calculated vs paid + variance
-- ---------------------------------------------------------------------
create table settlements (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organizations(id) on delete cascade,
  flock_id             uuid not null references flocks(id) on delete cascade,
  agreement_id         uuid references flock_agreements(id) on delete set null,
  calculated_paise     bigint,          -- our deterministic calculation
  paid_paise           bigint,          -- what integrator actually paid (entered/photo)
  variance_paise       bigint,          -- paid - calculated
  statement_photo_uri  text,
  status               text not null default 'draft',  -- draft | confirmed | disputed
  notes                text,
  created_by           uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz,
  unique (flock_id)
);
create index idx_settlements_org on settlements(org_id) where deleted_at is null;
create trigger trg_settlements_updated
  before update on settlements
  for each row execute function app_set_updated_at();

-- ---------------------------------------------------------------------
-- settlement_lines — itemized working (shown step-by-step to farmer)
-- ---------------------------------------------------------------------
create table settlement_lines (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  settlement_id uuid not null references settlements(id) on delete cascade,
  label         text not null,          -- e.g. "Base growing charge", "FCR bonus"
  amount_paise  bigint not null,        -- signed; negatives are deductions
  detail        text,                   -- human-readable working
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index idx_settle_lines on settlement_lines(settlement_id, sort_order);

-- ---------------------------------------------------------------------
-- expense_categories + expenses
-- ---------------------------------------------------------------------
create table expense_categories (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,            -- Feed, Chicks, Medicine, Labor, Other
  created_at  timestamptz not null default now()
);
create index idx_expcat_org on expense_categories(org_id);

create table expenses (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  flock_id      uuid references flocks(id) on delete cascade,
  category_id   uuid references expense_categories(id) on delete set null,
  category_name text,                    -- denormalized fallback
  occurred_date date not null,
  amount_paise  bigint not null check (amount_paise >= 0),
  photo_uri     text,
  notes         text,
  created_by    uuid,
  source_device_id uuid references devices(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index idx_expenses_flock on expenses(flock_id, occurred_date) where deleted_at is null;
create index idx_expenses_org on expenses(org_id);
create trigger trg_expenses_updated
  before update on expenses
  for each row execute function app_set_updated_at();
