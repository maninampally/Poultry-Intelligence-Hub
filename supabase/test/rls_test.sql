-- =====================================================================
-- RLS TEST — tenant isolation & role enforcement
-- Run AFTER the auth stub + all migrations on a test database.
-- Uses: set local app.current_user_id = '<uuid>' to impersonate a user
-- while running as a NON-superuser role (rls_tester) so policies apply.
--
-- Scenarios proven:
--   1. Farm A owner sees A's flock, NOT farm B's flock.
--   2. Worker in A can read/write operational data (daily_records).
--   3. Worker in A CANNOT read finance (expenses, settlements) -> 0 rows.
--   4. Worker in A CANNOT insert into expenses -> blocked.
--   5. A user with no membership sees nothing.
-- A failing assertion raises an exception and aborts (ON_ERROR_STOP).
-- =====================================================================

-- ---- Seed data as superuser (RLS not enforced for table owner) ------
-- Fixed UUIDs for determinism.
\set org_a  '''11111111-1111-1111-1111-111111111111'''
\set org_b  '''22222222-2222-2222-2222-222222222222'''
\set owner_a '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set worker_a '''cccccccc-cccc-cccc-cccc-cccccccccccc'''
\set owner_b '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
\set stranger '''dddddddd-dddd-dddd-dddd-dddddddddddd'''
\set farm_a '''f1111111-1111-1111-1111-111111111111'''
\set farm_b '''f2222222-2222-2222-2222-222222222222'''
\set flock_a '''c1111111-1111-1111-1111-111111111111'''
\set flock_b '''c2222222-2222-2222-2222-222222222222'''

insert into auth.users(id) values
  (:owner_a::uuid), (:worker_a::uuid), (:owner_b::uuid), (:stranger::uuid);

insert into organizations(id, name) values
  (:org_a::uuid, 'Org A'), (:org_b::uuid, 'Org B');

insert into organization_memberships(org_id, user_id, role) values
  (:org_a::uuid, :owner_a::uuid, 'owner'),
  (:org_a::uuid, :worker_a::uuid, 'worker'),
  (:org_b::uuid, :owner_b::uuid, 'owner');

insert into farms(id, org_id, name) values
  (:farm_a::uuid, :org_a::uuid, 'Farm A'),
  (:farm_b::uuid, :org_b::uuid, 'Farm B');

insert into flocks(id, org_id, farm_id, name, status) values
  (:flock_a::uuid, :org_a::uuid, :farm_a::uuid, 'Flock A', 'growing'),
  (:flock_b::uuid, :org_b::uuid, :farm_b::uuid, 'Flock B', 'growing');

insert into daily_records(org_id, flock_id, record_date, feed_kg, deaths) values
  (:org_a::uuid, :flock_a::uuid, current_date, 100, 2),
  (:org_b::uuid, :flock_b::uuid, current_date, 120, 1);

insert into expenses(org_id, flock_id, occurred_date, amount_paise) values
  (:org_a::uuid, :flock_a::uuid, current_date, 500000),
  (:org_b::uuid, :flock_b::uuid, current_date, 600000);

insert into settlements(org_id, flock_id, calculated_paise) values
  (:org_a::uuid, :flock_a::uuid, 1000000);

-- Create a non-superuser role so RLS is actually enforced, grant it DML.
do $$ begin
  create role rls_tester nologin;
exception when duplicate_object then null; end $$;
grant usage on schema public to rls_tester;
grant select, insert, update, delete on all tables in schema public to rls_tester;
grant execute on all functions in schema public to rls_tester;
-- helper functions are SECURITY DEFINER (owned by superuser) so they
-- still read membership correctly.

-- =====================================================================
-- Assertions. Each scenario is its own transaction so SET LOCAL applies.
-- We set role + impersonated user id within the transaction.
-- =====================================================================

-- Scenario 1: Owner A sees exactly 1 flock (A) and own finance.
begin;
  set local role rls_tester;
  set local app.current_user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  do $$
  declare n int;
  begin
    select count(*) into n from flocks;
    if n <> 1 then raise exception 'FAIL S1a: owner A sees % flocks, expected 1', n; end if;
    select count(*) into n from flocks where name = 'Flock B';
    if n <> 0 then raise exception 'FAIL S1b: owner A can see Flock B (cross-tenant leak!)'; end if;
    select count(*) into n from expenses;
    if n <> 1 then raise exception 'FAIL S1c: owner A sees % expenses, expected 1', n; end if;
    select count(*) into n from settlements;
    if n <> 1 then raise exception 'FAIL S1d: owner A sees % settlements, expected 1', n; end if;
    raise notice 'PASS S1: owner A sees only own flock + own finance';
  end $$;
commit;

-- Scenario 2: Worker A can read & write operational data.
begin;
  set local role rls_tester;
  set local app.current_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  do $$
  declare n int;
  begin
    select count(*) into n from daily_records;
    if n <> 1 then raise exception 'FAIL S2a: worker A sees % daily_records, expected 1', n; end if;
    insert into daily_records(org_id, flock_id, record_date, feed_kg, deaths)
      values ('11111111-1111-1111-1111-111111111111',
              'c1111111-1111-1111-1111-111111111111',
              current_date - 1, 95, 1);
    raise notice 'PASS S2: worker A reads+writes operational data';
  end $$;
commit;

-- Scenario 3: Worker A CANNOT read finance (RLS -> 0 rows).
begin;
  set local role rls_tester;
  set local app.current_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  do $$
  declare n int;
  begin
    select count(*) into n from expenses;
    if n <> 0 then raise exception 'FAIL S3a: worker A sees % expenses, expected 0 (finance leak!)', n; end if;
    select count(*) into n from settlements;
    if n <> 0 then raise exception 'FAIL S3b: worker A sees % settlements, expected 0 (finance leak!)', n; end if;
    raise notice 'PASS S3: worker A blocked from reading finance';
  end $$;
commit;

-- Scenario 4: Worker A CANNOT insert into expenses (WITH CHECK fails).
begin;
  set local role rls_tester;
  set local app.current_user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  do $$
  declare ok boolean := false;
  begin
    begin
      insert into expenses(org_id, flock_id, occurred_date, amount_paise)
        values ('11111111-1111-1111-1111-111111111111',
                'c1111111-1111-1111-1111-111111111111',
                current_date, 999);
    exception when insufficient_privilege then
      ok := true;
    end;
    if not ok then
      raise exception 'FAIL S4: worker A inserted an expense (finance write leak!)';
    end if;
    raise notice 'PASS S4: worker A blocked from inserting finance';
  end $$;
rollback;

-- Scenario 5: Stranger (no membership) sees nothing.
begin;
  set local role rls_tester;
  set local app.current_user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  do $$
  declare n int;
  begin
    select count(*) into n from flocks;
    if n <> 0 then raise exception 'FAIL S5a: stranger sees % flocks, expected 0', n; end if;
    select count(*) into n from daily_records;
    if n <> 0 then raise exception 'FAIL S5b: stranger sees % daily_records, expected 0', n; end if;
    raise notice 'PASS S5: stranger sees nothing';
  end $$;
commit;

select 'ALL RLS TESTS PASSED' as result;
