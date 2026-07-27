-- ==========================================================================
-- REPAIR — Restore service_role CRUD privileges ONLY.
-- ==========================================================================
--
-- Statement 1: GRANT SELECT,INSERT,UPDATE,DELETE on every public table
--              to service_role.
-- Why: service_role has lost all table privileges. This is the minimum
--      grant Supabase applies at project creation for the service role.
--      We use pg_tables (not information_schema) to ensure we catch
--      tables created by all methods including RPC.
-- Safety: GRANT is additive. It does not revoke anything from any other
--         role. Running it twice has zero effect.
--
-- Statement 2: GRANT USAGE,SELECT on all sequences to service_role.
-- Why: Tables with SERIAL/BIGSERIAL columns use sequences for id
--      generation. Without USAGE, INSERT would fail on any table with
--      a serial column (even if the column has a DEFAULT expression).
-- Safety: Same as above — purely additive, no side effects on other roles.
--
-- What is NOT modified:
--   - Table ownership (stays with postgres)
--   - RLS policies (untouched)
--   - authenticated privileges (untouched)
--   - anon privileges (untouched)
--   - Functions (untouched)
--   - Default privileges (untouched — not needed; explicit grants are sufficient)
-- ==========================================================================

do $$
declare
  t record;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  loop
    execute format(
      'grant select, insert, update, delete on public.%I to service_role',
      t.tablename
    );
    raise notice '✓ GRANT CRUD on public.%', t.tablename;
  end loop;
end
$$;

do $$
declare
  s record;
begin
  for s in
    select sequencename
    from pg_sequences
    where schemaname = 'public'
    order by sequencename
  loop
    execute format(
      'grant usage, select on sequence public.%I to service_role',
      s.sequencename
    );
    raise notice '✓ GRANT USAGE on sequence public.%', s.sequencename;
  end loop;
end
$$;
