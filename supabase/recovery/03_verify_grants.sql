-- ==========================================================================
-- VERIFY — Confirm service_role is repaired AND authenticated/anon unchanged.
-- Run AFTER the repair SQL. All results must be TRUE.
-- ==========================================================================

-- Section A: service_role privileges (should ALL be TRUE after repair)
select 'A: service_role' as check_group,
  tablename as table_name,
  has_table_privilege('service_role', 'public.' || quote_ident(tablename), 'SELECT') as can_select,
  has_table_privilege('service_role', 'public.' || quote_ident(tablename), 'INSERT') as can_insert,
  has_table_privilege('service_role', 'public.' || quote_ident(tablename), 'UPDATE') as can_update,
  has_table_privilege('service_role', 'public.' || quote_ident(tablename), 'DELETE') as can_delete
from pg_tables
where schemaname = 'public'
order by tablename;

-- Section B: Compare service_role vs authenticated vs anon side-by-side.
-- After repair, service_role should match or exceed authenticated.
select 'B: side-by-side' as check_group,
  tablename as table_name,
  has_table_privilege('service_role',   'public.' || quote_ident(tablename), 'SELECT') as sr_select,
  has_table_privilege('authenticated',  'public.' || quote_ident(tablename), 'SELECT') as au_select,
  has_table_privilege('anon',           'public.' || quote_ident(tablename), 'SELECT') as an_select,
  has_table_privilege('service_role',   'public.' || quote_ident(tablename), 'INSERT') as sr_insert,
  has_table_privilege('authenticated',  'public.' || quote_ident(tablename), 'INSERT') as au_insert,
  has_table_privilege('service_role',   'public.' || quote_ident(tablename), 'UPDATE') as sr_update,
  has_table_privilege('authenticated',  'public.' || quote_ident(tablename), 'UPDATE') as au_update,
  has_table_privilege('service_role',   'public.' || quote_ident(tablename), 'DELETE') as sr_delete,
  has_table_privilege('authenticated',  'public.' || quote_ident(tablename), 'DELETE') as au_delete
from pg_tables
where schemaname = 'public'
order by tablename;

-- Section C: Confirm no RLS policies were altered.
-- This is a static check — it should return the same results as before the repair.
select 'C: RLS policies (should be unchanged)' as check_group,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
