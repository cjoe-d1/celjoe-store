-- =======================================================================
-- Phase 12 Schema Audit (READ-ONLY)
-- Project: Celjoe Hospitality Commerce Platform
-- Purpose:  Compare the live Supabase schema against the approved
--           Phase A–D architecture. No DDL or DML — inspection only.
-- Run in:   Supabase SQL Editor (Dashboard → SQL Editor)
-- =======================================================================

-- Capture output here (session-local)
create temp table if not exists phase12_audit_output (
  section_no int not null,
  section_name text not null,
  line_no bigint not null generated always as identity,
  line text not null
) on commit drop;

-- Ensure empty (in case you rerun)
truncate table phase12_audit_output;

-----------------------------------------------------------------------
-- 1. EVERY TABLE
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '1. ALL USER TABLES (schema=public)';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (1, sname, '══════════════════════════════════');

  for rec in
    select
      t.table_name,
      pg_size_pretty(pg_total_relation_size(quote_ident('public')||'.'||quote_ident(t.table_name))) as total_size,
      (select count(*)
         from information_schema.columns c
        where c.table_schema='public'
          and c.table_name=t.table_name) as col_count,
      (
        select case when c.relrowsecurity then 'enabled' else 'disabled' end
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = t.table_name
      ) as rls_enabled
    from information_schema.tables t
    where t.table_schema='public'
      and t.table_type='BASE TABLE'
    order by t.table_name
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      1, sname,
      format('  %s  %s cols  %s  RLS=%s',
        rec.table_name,
        rec.col_count::text,
        rec.total_size,
        coalesce(rec.rls_enabled::text,'?')
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 2. EVERY COLUMN (per table)
-----------------------------------------------------------------------
do $$
declare
  rec record;
  prev text := '';
  sname text := '2. COLUMNS PER TABLE';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (2, sname, '══════════════════════════════════');

  for rec in
    select c.table_name,
           c.column_name,
           case
             when c.character_maximum_length is not null
               then c.data_type || '(' || c.character_maximum_length || ')'
             when c.numeric_precision is not null and c.data_type in ('numeric','decimal')
               then c.data_type || '(' || c.numeric_precision || ',' || coalesce(c.numeric_scale,0) || ')'
             else c.data_type
           end as full_type,
           c.is_nullable, c.column_default, c.ordinal_position
    from information_schema.columns c
    where c.table_schema='public'
    order by c.table_name, c.ordinal_position
  loop
    if prev <> rec.table_name then
      insert into phase12_audit_output(section_no, section_name, line)
      values (2, sname, format('  [%s]', rec.table_name));
      prev := rec.table_name;
    end if;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      2, sname,
      format('    %s  %s  nullable=%s  default=%s',
        rec.column_name,
        rec.full_type,
        rec.is_nullable,
        coalesce(rec.column_default::text, '—')
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 3. PRIMARY KEYS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '3. PRIMARY KEYS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (3, sname, '══════════════════════════════════');

  for rec in
    select tc.table_name, kc.column_name, tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kc
      on kc.constraint_name=tc.constraint_name
     and kc.table_schema=tc.table_schema
     and kc.table_name=tc.table_name
    where tc.constraint_type='PRIMARY KEY'
      and tc.table_schema='public'
    order by tc.table_name, kc.ordinal_position
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      3, sname,
      format('  %s.%s  PK  (%s)', rec.table_name, rec.column_name, rec.constraint_name)
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 4. FOREIGN KEYS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '4. FOREIGN KEYS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (4, sname, '══════════════════════════════════');

  for rec in
    select tc.table_name, kc.column_name,
           ccu.table_name as foreign_table, ccu.column_name as foreign_column,
           rc.delete_rule as on_delete, rc.update_rule as on_update,
           tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kc
      on kc.constraint_name=tc.constraint_name
     and kc.table_schema=tc.table_schema
     and kc.table_name=tc.table_name
    join information_schema.constraint_column_usage ccu
      on ccu.constraint_name=tc.constraint_name
     and ccu.table_schema=tc.table_schema
    join information_schema.referential_constraints rc
      on rc.constraint_name=tc.constraint_name
     and rc.constraint_schema=tc.table_schema
    where tc.constraint_type='FOREIGN KEY'
      and tc.table_schema='public'
    order by tc.table_name, kc.column_name
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      4, sname,
      format(
        '  %s.%s → %s.%s   ON DELETE %s (ON UPDATE %s)',
        rec.table_name, rec.column_name,
        rec.foreign_table, rec.foreign_column,
        rec.on_delete, rec.on_update
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 5. INDEXES (user-created only, exclude PK auto-indexes)
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '5. USER INDEXES';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (5, sname, '══════════════════════════════════');

  for rec in
    select tablename, indexname, indexdef
    from pg_indexes
    where schemaname='public'
      and indexname not like '%_pkey'
      and indexname not like 'pg_%'
      and indexname not like '%_pkey%'
    order by tablename, indexname
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (5, sname, format('  %s  →  %s', rec.tablename, rec.indexdef));
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 6. CHECK + UNIQUE CONSTRAINTS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '6. CHECK & UNIQUE CONSTRAINTS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (6, sname, '══════════════════════════════════');

  for rec in
    select tc.table_name, tc.constraint_name, tc.constraint_type,
           cc.check_clause
    from information_schema.table_constraints tc
    left join information_schema.check_constraints cc
      on cc.constraint_name=tc.constraint_name
     and cc.constraint_schema=tc.table_schema
    where tc.table_schema='public'
      and tc.constraint_type in ('CHECK','UNIQUE')
    order by tc.table_name, tc.constraint_type
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      6, sname,
      format('  %s.%s  %s  %s',
        rec.table_name,
        rec.constraint_name,
        rec.constraint_type,
        coalesce(rec.check_clause::text,'—')
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 7. ENUMS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '7. ENUMS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (7, sname, '══════════════════════════════════');

  for rec in
    select t.typname,
           string_agg(e.enumlabel, ' | ' order by e.enumsortorder) as vals
    from pg_type t
    join pg_enum e on e.enumtypid=t.oid
    where t.typtype='e'
    group by t.typname
    order by t.typname
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (7, sname, format('  %s  =  {%s}', rec.typname, rec.vals));
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 8. TRIGGERS (user-created, non-internal)
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '8. TRIGGERS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (8, sname, '══════════════════════════════════');

  for rec in
    select tgname as trigger_name,
           relname as table_name,
           proname as function_called,
           case when tgtype & 2 =2 then 'BEFORE' else 'AFTER' end as timing,
           case when tgtype & 4 =4 then 'ROW' else 'STATEMENT' end as lvl,
           trim(
             case when tgtype & 16=16 then 'INSERT' else '' end
          || case when tgtype & 8 =8  then ' UPDATE' else '' end
          || case when tgtype & 32=32 then ' DELETE' else '' end
          || case when tgtype & 64=64 then ' TRUNCATE' else '' end
           ) as events
    from pg_trigger
    join pg_class on pg_trigger.tgrelid=pg_class.oid
    join pg_proc  on pg_trigger.tgfoid =pg_proc.oid
    where not tgisinternal
      and relnamespace='public'::regnamespace
    order by table_name, trigger_name
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      8, sname,
      format('  %s on %s → %s (%s %s %s)',
        rec.trigger_name,
        rec.table_name,
        rec.function_called,
        rec.timing,
        rec.lvl,
        rec.events
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 9. RLS POLICIES
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '9. RLS POLICIES';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (9, sname, '══════════════════════════════════');

  for rec in
    select schemaname, tablename, policyname, permissive,
           roles, cmd
    from pg_policies
    where schemaname='public'
    order by tablename, policyname
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      9, sname,
      format(
        '  %s.%s  policy=%s  roles=%s  cmd=%s  permissive=%s',
        rec.schemaname, rec.tablename,
        rec.policyname,
        rec.roles::text, rec.cmd, rec.permissive
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 10. STORAGE BUCKETS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '10. STORAGE BUCKETS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (10, sname, '══════════════════════════════════');

  for rec in
    select id, name,
           case when public then 'PUBLIC' else 'PRIVATE' end as access,
           file_size_limit, allowed_mime_types
    from storage.buckets
    order by name
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      10, sname,
      format('  %s  access=%s  size-limit=%s  mime=%s',
        rec.name, rec.access,
        coalesce(rec.file_size_limit::text,'—'),
        coalesce(rec.allowed_mime_types::text,'—')
      )
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 11. USER FUNCTIONS (schema=public)
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '11. USER FUNCTIONS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (11, sname, '══════════════════════════════════');

  for rec in
    select p.proname as fn_name,
           pg_get_function_result(p.oid) as returns,
           pg_get_function_identity_arguments(p.oid) as args,
           l.lanname as lang
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    join pg_language l on l.oid=p.prolang
    where n.nspname='public'
    order by p.proname
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (
      11, sname,
      format('  %s(%s) → %s  [%s]', rec.fn_name, rec.args, rec.returns, rec.lang)
    );
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 12. VIEWS
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '12. VIEWS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (12, sname, '══════════════════════════════════');

  for rec in
    select table_name
    from information_schema.views
    where table_schema='public'
    order by table_name
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (12, sname, format('  %s', rec.table_name));
  end loop;
end
$$;

-----------------------------------------------------------------------
-- 13. MIGRATION TRACKING
-----------------------------------------------------------------------
do $$
declare
  rec record;
  sname text := '13. MIGRATIONS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (13, sname, '══════════════════════════════════');

  if exists (
    select 1 from pg_tables
    where schemaname='supabase_migrations' and tablename='schema_migrations'
  ) then
    insert into phase12_audit_output(section_no, section_name, line)
    values (13, sname, '  supabase_migrations.schema_migrations:');
    for rec in
      select version
      from supabase_migrations.schema_migrations
      order by version
    loop
      insert into phase12_audit_output(section_no, section_name, line)
      values (13, sname, format('  %s ✓', rec.version));
    end loop;
  else
    insert into phase12_audit_output(section_no, section_name, line)
    values (13, sname, '  (no supabase_migrations.schema_migrations found)');
  end if;

  if exists (
    select 1 from pg_tables
    where schemaname='public' and tablename='supabase_migrations'
  ) then
    insert into phase12_audit_output(section_no, section_name, line)
    values (13, sname, '  public.supabase_migrations table EXISTS (manual migration tracking?)');
  else
    insert into phase12_audit_output(section_no, section_name, line)
    values (13, sname, '  (no public.supabase_migrations table)');
  end if;
end
$$;

-----------------------------------------------------------------------
-- 14. REMNANT CHECK — targeted audit for phased-out structures
-----------------------------------------------------------------------
do $$
declare
  _exists boolean;
  col_rec  record;
  tbl_rec  record;
  chk_rec  record;
  sname text := '14. REMNANT CHECK (Phases A–D)';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '══════════════════════════════════');

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- DROPPED TABLES ---');

  for tbl_rec in
    select unnest(array['riders','staff','ingredients','suppliers','stock_movements']) as tn
  loop
    select exists(
      select 1 from information_schema.tables
      where table_schema='public' and table_name=tbl_rec.tn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  %s → %s',
        tbl_rec.tn,
        case when _exists then '⚠ PRESENT (should be absent)' else '✓ ABSENT' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- OLD PRODUCT COLUMNS (should be absent) ---');

  for col_rec in
    select unnest(array['sku','barcode','cost_price','compare_price','visibility','experience','image_url','gallery']) as cn
  loop
    select exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='products' and column_name=col_rec.cn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  products.%s → %s',
        col_rec.cn,
        case when _exists then '⚠ PRESENT' else '✓ ABSENT' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- NEW PRODUCT COLUMNS (should be present) ---');

  for col_rec in
    select unnest(array['short_description','preparation_minutes','discount_price','tags','is_featured','is_archived']) as cn
  loop
    select exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='products' and column_name=col_rec.cn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  products.%s → %s',
        col_rec.cn,
        case when _exists then '✓ PRESENT' else '⚠ MISSING' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- PRODUCT IMAGES TABLE ---');

  select exists(
    select 1 from information_schema.tables
    where table_schema='public' and table_name='product_images'
  ) into _exists;

  if _exists then
    insert into phase12_audit_output(section_no, section_name, line)
    values (14, sname, '  product_images → ✓ PRESENT');

    for col_rec in
      select column_name, data_type, is_nullable
      from information_schema.columns
      where table_schema='public' and table_name='product_images'
      order by ordinal_position
    loop
      insert into phase12_audit_output(section_no, section_name, line)
      values (
        14, sname,
        format('    %s %s nullable=%s', col_rec.column_name, col_rec.data_type, col_rec.is_nullable)
      );
    end loop;
  else
    insert into phase12_audit_output(section_no, section_name, line)
    values (14, sname, '  product_images → ⚠ MISSING (Phase D requires this)');
  end if;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- PRODUCT VARIANTS TABLE ---');

  for col_rec in
    select unnest(array['stock_quantity','is_available','position']) as cn
  loop
    select exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='product_variants' and column_name=col_rec.cn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  product_variants.%s → %s',
        col_rec.cn,
        case when _exists then '✓ PRESENT' else '⚠ MISSING' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- ORDERS STATUS CONSTRAINT ---');

  for chk_rec in
    select check_clause
    from information_schema.check_constraints cc
    join information_schema.table_constraints tc
      on tc.constraint_name=cc.constraint_name
     and tc.table_schema=cc.constraint_schema
    where cc.constraint_schema='public'
      and tc.table_name='orders'
      and tc.constraint_type='CHECK'
      and (cc.check_clause ilike '%status%' or cc.check_clause ilike '%pending%')
    limit 5
  loop
    insert into phase12_audit_output(section_no, section_name, line)
    values (14, sname, format('  CHECK: %s', chk_rec.check_clause));

    if position('out_for_delivery' in chk_rec.check_clause) > 0 then
      insert into phase12_audit_output(section_no, section_name, line)
      values (14, sname, '    ⚠ OLD STATUS: out_for_delivery');
    end if;

    if position('delivered' in chk_rec.check_clause) > 0 then
      insert into phase12_audit_output(section_no, section_name, line)
      values (14, sname, '    ⚠ OLD STATUS: delivered');
    end if;
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- ORDERS RIDER COLUMNS (should be absent) ---');

  for col_rec in
    select unnest(array['rider_id','assigned_rider_id','assigned_rider','rider_notes']) as cn
  loop
    select exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='orders' and column_name=col_rec.cn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  orders.%s → %s',
        col_rec.cn,
        case when _exists then '⚠ PRESENT' else '✓ ABSENT' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- LEGACY AUTH TABLES ---');

  for tbl_rec in
    select unnest(array['admin_users','roles','admin_roles','permissions','admin_permissions']) as tn
  loop
    select exists(
      select 1 from information_schema.tables
      where table_schema='public' and table_name=tbl_rec.tn
    ) into _exists;

    insert into phase12_audit_output(section_no, section_name, line)
    values (
      14, sname,
      format(
        '  %s → %s',
        tbl_rec.tn,
        case when _exists then '⚠ PRESENT (legacy auth)' else '✓ ABSENT' end
      )
    );
  end loop;

  insert into phase12_audit_output(section_no, section_name, line)
  values (14, sname, '--- product-images STORAGE BUCKET ---');

  select exists(
    select 1 from storage.buckets where name='product-images'
  ) into _exists;

  insert into phase12_audit_output(section_no, section_name, line)
  values (
    14, sname,
    format(
      '  product-images bucket → %s',
      case when _exists then '✓ PRESENT' else '⚠ MISSING (Phase D requires this)' end
    )
  );
end
$$;

-----------------------------------------------------------------------
-- 15. ROW COUNTS
-----------------------------------------------------------------------
do $$
declare
  r record;
  cnt bigint;
  sname text := '15. ROW COUNTS';
begin
  insert into phase12_audit_output(section_no, section_name, line)
  values (15, sname, '══════════════════════════════════');

  for r in
    select table_name
    from information_schema.tables
    where table_schema='public' and table_type='BASE TABLE'
    order by table_name
  loop
    execute format('select count(*) from public.%I', r.table_name) into cnt;

    insert into phase12_audit_output(section_no, section_name, line)
    values (15, sname, format('  %s  %s rows', r.table_name, cnt));
  end loop;
end
$$;

-----------------------------------------------------------------------
-- Final Output (what you will see in Results)
-----------------------------------------------------------------------
select
  section_no,
  section_name,
  line
from phase12_audit_output
order by section_no, line_no;
