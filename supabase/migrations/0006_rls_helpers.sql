-- =====================================================================
-- Poultry Intelligence Hub — 0006 RLS helper functions
-- SECURITY DEFINER helpers used by policies. These centralize the
-- "is this user allowed in this org / at this role" logic so policies
-- stay short and consistent.
--
-- auth.uid() is provided by Supabase (the authenticated user's id).
-- The app role must NOT have BYPASSRLS. No cross-tenant read is possible
-- even if application code is wrong.
-- =====================================================================

-- Current user's membership role in an org (NULL if not a member).
create or replace function app_role_in_org(p_org uuid)
returns member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from organization_memberships m
  where m.org_id = p_org
    and m.user_id = auth.uid()
  limit 1;
$$;

-- Is the current user any member of the org?
create or replace function app_is_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_memberships m
    where m.org_id = p_org and m.user_id = auth.uid()
  );
$$;

-- Is the current user owner or manager (i.e. may touch finance/settlement)?
create or replace function app_is_manager(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
  );
$$;

-- Is the current user the owner?
create or replace function app_is_owner(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- Can the current user access a flock (member of its org)?
-- Workers are additionally limited to assigned sheds where applicable;
-- for v1 we scope workers to org membership + shed assignment on the
-- flock's shed when a shed is set.
create or replace function app_can_access_flock(p_flock uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from flocks f
    join organization_memberships m
      on m.org_id = f.org_id and m.user_id = auth.uid()
    where f.id = p_flock
      and (
        m.role in ('owner', 'manager')
        or f.shed_id is null
        or exists (
          select 1 from shed_assignments sa
          where sa.user_id = auth.uid() and sa.shed_id = f.shed_id
        )
      )
  );
$$;
