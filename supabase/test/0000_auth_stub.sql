-- =====================================================================
-- 0000 LOCAL/TEST SHIM — Supabase auth stub
-- Supabase provides the `auth` schema, `auth.users`, and `auth.uid()`.
-- When running migrations against a plain Postgres (local dev / CI /
-- migration smoke tests) we stub them. On Supabase this file is NOT
-- applied (Supabase already defines auth). Keep it first in test runs.
-- =====================================================================
create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- auth.uid() reads a GUC we can set per-session in tests:
--   set local app.current_user_id = '<uuid>';
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_user_id', true), '')::uuid;
$$;
