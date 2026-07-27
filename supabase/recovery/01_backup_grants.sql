-- ==========================================================================
-- STEP 1: BACKUP — Export current grants for every public table.
-- Run in Supabase SQL Editor. Save the output before proceeding.
-- ==========================================================================

select
  table_name,
  privilege_type,
  grantee,
  is_grantable
from information_schema.table_privileges
where table_schema = 'public'
order by table_name, grantee, privilege_type;

-- Also capture role memberships
select
  r.rolname as role,
  array_agg(m.rolname order by m.rolname) as member_of
from pg_roles r
left join pg_auth_members am on r.oid = am.member
left join pg_roles m on am.roleid = m.oid
where r.rolname in ('service_role','authenticated','anon','postgres','supabase_admin')
group by r.rolname
order by r.rolname;
