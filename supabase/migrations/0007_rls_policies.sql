-- =====================================================================
-- Poultry Intelligence Hub — 0007 Row-Level Security policies
-- Enables RLS on every table and defines access policies.
--
-- Authorization matrix (see docs/DATA_MODEL.md):
--   * Members of an org can read/write that org's OPERATIONAL data.
--   * Workers are BLOCKED from finance/settlement tables:
--       counterparties, flock_agreements, agreement_rules,
--       chick_placements, feed_receipts, feed_returns,
--       lifting_events, settlements, settlement_lines,
--       expenses, expense_categories, batch_summaries (finance cols),
--       audit_log.
--   * Only owners/managers can manage farms, sheds, memberships.
--
-- Pattern: operational tables use app_is_member(org_id) for RW.
--          finance tables use app_is_manager(org_id) for RW.
-- =====================================================================

-- Helper macro note: Postgres has no policy macros, so each table is
-- spelled out. Policies are permissive (default) and combined by OR.

-- =========================== TENANCY ================================

alter table organizations enable row level security;
create policy org_select on organizations for select
  using (app_is_member(id));
create policy org_update on organizations for update
  using (app_is_owner(id)) with check (app_is_owner(id));
-- Insert of a brand-new org is handled by a SECURITY DEFINER bootstrap
-- function (0008); no direct client insert policy here.

alter table profiles enable row level security;
create policy profiles_self_select on profiles for select
  using (id = auth.uid());
create policy profiles_self_upsert on profiles for insert
  with check (id = auth.uid());
create policy profiles_self_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

alter table organization_memberships enable row level security;
-- A user can see memberships of orgs they belong to.
create policy memb_select on organization_memberships for select
  using (app_is_member(org_id));
-- Only owners/managers manage memberships.
create policy memb_insert on organization_memberships for insert
  with check (app_is_manager(org_id));
create policy memb_update on organization_memberships for update
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));
create policy memb_delete on organization_memberships for delete
  using (app_is_owner(org_id));

alter table devices enable row level security;
create policy devices_rw on devices for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table farms enable row level security;
create policy farms_select on farms for select
  using (app_is_member(org_id));
create policy farms_write on farms for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table sheds enable row level security;
create policy sheds_select on sheds for select
  using (app_is_member(org_id));
create policy sheds_write on sheds for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table shed_assignments enable row level security;
create policy shedassign_select on shed_assignments for select
  using (app_is_member(org_id));
create policy shedassign_write on shed_assignments for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

-- ===================== OPERATIONAL (members RW) =====================
-- flocks + daily/event tables: any org member can read/write.

alter table flocks enable row level security;
create policy flocks_rw on flocks for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table flock_status_history enable row level security;
create policy flockhist_rw on flock_status_history for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table daily_records enable row level security;
create policy daily_rw on daily_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table mortality_records enable row level security;
create policy mortality_rw on mortality_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table feed_records enable row level security;
create policy feed_rw on feed_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table water_records enable row level security;
create policy water_rw on water_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table weight_records enable row level security;
create policy weight_rw on weight_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table medicines enable row level security;
create policy medicines_rw on medicines for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table medicine_records enable row level security;
create policy medrec_rw on medicine_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table vaccination_records enable row level security;
create policy vacc_rw on vaccination_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table health_records enable row level security;
create policy health_rw on health_records for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

-- ================= FINANCE / SETTLEMENT (managers RW) ===============
-- Workers CANNOT read or write these. app_is_manager = owner|manager.

alter table counterparties enable row level security;
create policy cparty_rw on counterparties for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table flock_agreements enable row level security;
create policy agreement_rw on flock_agreements for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table agreement_rules enable row level security;
create policy rules_rw on agreement_rules for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table chick_placements enable row level security;
create policy placement_rw on chick_placements for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table feed_receipts enable row level security;
create policy feedrcpt_rw on feed_receipts for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table feed_returns enable row level security;
create policy feedret_rw on feed_returns for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table lifting_events enable row level security;
create policy lifting_rw on lifting_events for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table settlements enable row level security;
create policy settle_rw on settlements for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table settlement_lines enable row level security;
create policy settleline_rw on settlement_lines for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table expense_categories enable row level security;
create policy expcat_rw on expense_categories for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table expenses enable row level security;
create policy expenses_rw on expenses for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

-- ===================== SUMMARIES / PROJECTIONS ======================
-- batch_summaries & flock_metrics contain finance columns -> managers only
-- for summaries; flock_metrics is operational (no money) -> members read.

alter table batch_summaries enable row level security;
create policy batchsum_select on batch_summaries for select
  using (app_is_manager(org_id));
create policy batchsum_write on batch_summaries for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

alter table flock_metrics enable row level security;
create policy flockmetrics_select on flock_metrics for select
  using (app_is_member(org_id));
create policy flockmetrics_write on flock_metrics for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

-- ===================== NOTIFICATIONS / AI ===========================

alter table notifications enable row level security;
create policy notif_select on notifications for select
  using (app_is_member(org_id) and (user_id is null or user_id = auth.uid()));
create policy notif_update on notifications for update
  using (app_is_member(org_id)) with check (app_is_member(org_id));
create policy notif_write on notifications for insert
  with check (app_is_member(org_id));

alter table ai_conversations enable row level security;
create policy aiconv_rw on ai_conversations for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table ai_messages enable row level security;
create policy aimsg_rw on ai_messages for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table ai_insights enable row level security;
create policy aiinsight_select on ai_insights for select
  using (app_is_member(org_id));
create policy aiinsight_write on ai_insights for all
  using (app_is_manager(org_id)) with check (app_is_manager(org_id));

-- ===================== SYNC / AUDIT =================================

alter table sync_operations enable row level security;
create policy syncops_rw on sync_operations for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

alter table sync_cursors enable row level security;
create policy synccursor_rw on sync_cursors for all
  using (app_is_member(org_id)) with check (app_is_member(org_id));

-- Audit log: managers read; inserts allowed for any member (fire-and-forget);
-- no updates/deletes (append-only).
alter table audit_log enable row level security;
create policy audit_select on audit_log for select
  using (app_is_manager(org_id));
create policy audit_insert on audit_log for insert
  with check (app_is_member(org_id));
