-- =====================================================================
-- Poultry Intelligence Hub — 0004 Summaries, notifications, AI
-- Derived/summary tables (written by the analytics worker, rebuildable
-- from source), notifications, and AI conversation storage.
--
-- Summaries are PROJECTIONS: never a source of truth. They exist so the
-- home screen and batch comparison stay fast without scanning raw records.
-- Money in integer paise.
-- =====================================================================

-- ---------------------------------------------------------------------
-- batch_summaries — written when a flock completes; drives comparison
-- ---------------------------------------------------------------------
create table batch_summaries (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organizations(id) on delete cascade,
  flock_id             uuid not null references flocks(id) on delete cascade,
  farm_id              uuid not null references farms(id) on delete cascade,
  birds_placed         integer,
  birds_lifted         integer,
  total_mortality      integer,
  mortality_pct        numeric(6,3),
  livability_pct       numeric(6,3),
  avg_weight_kg        numeric(8,4),
  total_feed_kg        numeric(12,3),
  fcr                  numeric(8,4),
  duration_days        integer,
  -- finance (paise)
  revenue_paise        bigint,
  feed_cost_paise      bigint,
  chick_cost_paise     bigint,
  medicine_cost_paise  bigint,
  labor_cost_paise     bigint,
  other_cost_paise     bigint,
  total_cost_paise     bigint,
  net_settlement_paise bigint,
  profit_paise         bigint,
  cost_per_bird_paise  bigint,
  cost_per_kg_paise    bigint,
  profit_per_bird_paise bigint,
  computed_at          timestamptz not null default now(),
  unique (flock_id)
);
create index idx_batchsum_farm on batch_summaries(farm_id);
create index idx_batchsum_org on batch_summaries(org_id);

-- ---------------------------------------------------------------------
-- flock_metrics — live projection for the active flock (rebuildable)
-- ---------------------------------------------------------------------
create table flock_metrics (
  flock_id             uuid primary key references flocks(id) on delete cascade,
  org_id               uuid not null references organizations(id) on delete cascade,
  age_days             integer,
  current_birds        integer,
  total_mortality      integer,
  mortality_pct        numeric(6,3),
  livability_pct       numeric(6,3),
  avg_weight_kg        numeric(8,4),
  total_feed_kg        numeric(12,3),
  provisional_fcr      numeric(8,4),
  feed_runway_days     integer,
  completeness_pct     integer,
  last_record_date     date,
  updated_at           timestamptz not null default now()
);
create index idx_flockmetrics_org on flock_metrics(org_id);

-- ---------------------------------------------------------------------
-- notifications — actionable alerts (written by alert worker)
-- ---------------------------------------------------------------------
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  farm_id     uuid references farms(id) on delete cascade,
  flock_id    uuid references flocks(id) on delete cascade,
  user_id     uuid,                      -- target user; null = all org members
  kind        text not null,             -- mortality_spike | feed_deviation | lifting_window | ...
  severity    text not null default 'watch',  -- normal | watch | act
  title       text not null,
  body        text,
  action      text,                      -- deep link / route hint
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_notif_org on notifications(org_id, created_at desc);
create index idx_notif_user on notifications(user_id) where read_at is null;

-- ---------------------------------------------------------------------
-- ai_conversations + ai_messages — assistant history (read-only tools)
-- ---------------------------------------------------------------------
create table ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid,
  flock_id    uuid references flocks(id) on delete set null,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_aiconv_org on ai_conversations(org_id);
create trigger trg_aiconv_updated
  before update on ai_conversations
  for each row execute function app_set_updated_at();

create table ai_messages (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role            text not null,          -- user | assistant | tool
  content         text,
  tool_calls      jsonb,                  -- which deterministic tools were called
  feedback        text,                   -- up | down | null
  created_at      timestamptz not null default now()
);
create index idx_aimsg_conv on ai_messages(conversation_id, created_at);

-- ---------------------------------------------------------------------
-- ai_insights — generated observations tied to a flock
-- ---------------------------------------------------------------------
create table ai_insights (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  flock_id    uuid references flocks(id) on delete cascade,
  kind        text,
  summary     text not null,
  data        jsonb,                      -- the verified metrics behind it
  created_at  timestamptz not null default now()
);
create index idx_aiinsight_flock on ai_insights(flock_id);
