-- =====================================================================
-- Poultry Intelligence Hub — 0010 Require device_id on sync_operations
-- Phase 1: NULL device_id broke UNIQUE (org, device, key) because
-- Postgres treats NULLs as distinct. Push now always sends a device.
-- =====================================================================

-- Drop orphan log rows that never had a device (scaffold leftovers).
delete from sync_operations where device_id is null;

alter table sync_operations
  alter column device_id set not null;
