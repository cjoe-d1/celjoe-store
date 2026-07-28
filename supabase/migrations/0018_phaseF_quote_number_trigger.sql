begin;

-- ============================================================
-- Phase F — Quote Number Generator Fix
-- ============================================================
-- Problem: generate_quote_number() existed but was never
-- triggered. New inserts received NULL quote_number, violating
-- the NOT NULL constraint.
--
-- Fix:
--   1. Harden the function with transaction-level advisory
--      locks to prevent concurrent duplicate generation.
--   2. Backfill any existing NULL quote_number rows.
--   3. Create a BEFORE INSERT trigger that auto-assigns
--      quote_number when NEW.quote_number IS NULL — leaving
--      manually supplied values untouched.
-- ============================================================

-- 1. Replace the quote-number function (concurrency-safe) -----

create or replace function public.generate_quote_number()
returns text
language plpgsql
as $$
declare
  lock_key bigint;
  today     text;
  seq       integer;
begin
  today    := to_char(now() at time zone 'Africa/Lagos', 'YYYYMMDD');
  lock_key := hashtext('quotations_quote_number_' || today);

  -- Transaction-level advisory lock: released automatically
  -- at COMMIT / ROLLBACK.  This serialises concurrent inserts
  -- for the same date so that max(…) + 1 never collides.
  perform pg_advisory_xact_lock(lock_key);

  select coalesce(
    max(substring(quote_number from 'QT-\d{8}-(\d+)')::integer), 0
  ) + 1
    into seq
    from public.quotations
   where quote_number like 'QT-' || today || '-%';

  return 'QT-' || today || '-' || lpad(seq::text, 4, '0');
end;
$$;

-- 2. Backfill existing rows with NULL quote_number ------------

do $$
declare
  r record;
begin
  for r in
    select id
      from public.quotations
     where quote_number is null
     order by created_at
  loop
    update public.quotations
       set quote_number = public.generate_quote_number()
     where id = r.id;
  end loop;
end;
$$;

-- 3. Create the BEFORE INSERT trigger -------------------------

create or replace function public.trg_quotations_quote_number()
returns trigger
language plpgsql
as $$
begin
  if new.quote_number is null then
    new.quote_number := public.generate_quote_number();
  end if;
  return new;
end;
$$;

drop trigger if exists quotations_quote_number on public.quotations;
create trigger quotations_quote_number
  before insert on public.quotations
  for each row
  execute function public.trg_quotations_quote_number();

commit;
