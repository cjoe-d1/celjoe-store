-- ============================================================
-- Phase G — Push Notification Subscriptions
-- Migration: 0019
-- ============================================================
-- Stores browser Push API subscription objects so the server
-- can send push notifications to admin devices via web-push.
--
-- One admin user may have multiple subscriptions (phone,
-- desktop, tablet). Each subscription is uniquely identified
-- by (user_id, endpoint).
--
-- RLS: Admins manage their own subscriptions via the auth
-- cookie. The service role bypasses RLS for server-side
-- dispatch (sending push to all admin devices).
-- ============================================================

begin;

-- 1. Create table -------------------------------------------

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,
  p256dh        text not null,
  auth          text not null,
  user_agent    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Prevent duplicate subscriptions for the same user+device
  constraint uq_push_subscriptions_user_endpoint
    unique (user_id, endpoint)
);

-- Fast lookup during push dispatch — fetch all subscriptions
-- for a given admin user.
create index idx_push_subscriptions_user_id
  on public.push_subscriptions (user_id);

-- 2. Enable RLS ---------------------------------------------

alter table public.push_subscriptions
  enable row level security;

-- 3. RLS Policies -------------------------------------------

-- Policy 1: Admins can view their own subscriptions.
-- Needed when the PWA re-subscribes on each visit to verify
-- an existing subscription is still valid.
create policy "Admins select own subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() = user_id);

-- Policy 2: Admins can insert their own subscriptions.
-- Triggered when the admin clicks "Enable Notifications"
-- and the browser creates a PushSubscription.
create policy "Admins insert own subscriptions"
  on public.push_subscriptions
  for insert
  with check (auth.uid() = user_id);

-- Policy 3: Admins can delete their own subscriptions.
-- Triggered when an admin clicks "Disable Notifications"
-- or when the service worker detects an expired subscription.
create policy "Admins delete own subscriptions"
  on public.push_subscriptions
  for delete
  using (auth.uid() = user_id);

-- No UPDATE policy needed — subscriptions are immutable once
-- created. If a browser generates a new subscription, the old
-- one is deleted and a new row is inserted.

-- 4. Service role grants ------------------------------------

grant select, insert, update, delete
  on table public.push_subscriptions
  to service_role;

-- The service role needs SELECT for dispatch (read all admin
-- subscriptions) and DELETE for cleanup (remove expired
-- subscriptions that returned 404/410 from the push service).
-- INSERT is needed for the API route that stores subscriptions
-- (the API route uses the service role client).

-- 5. Trigger: updated_at ------------------------------------

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row
  execute function public.set_updated_at();

commit;

-- ============================================================
-- Verification SQL
-- ============================================================

-- A. Table exists
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'push_subscriptions';

-- B. RLS is enabled
select
  relname,
  relrowsecurity
from pg_class
where relname = 'push_subscriptions';

-- C. Policies exist
select
  policyname,
  permissive,
  cmd
from pg_policies
where tablename = 'push_subscriptions'
order by cmd;

-- D. Service role has full access
select
  has_table_privilege('service_role', 'public.push_subscriptions', 'select')   as can_select,
  has_table_privilege('service_role', 'public.push_subscriptions', 'insert')   as can_insert,
  has_table_privilege('service_role', 'public.push_subscriptions', 'update')   as can_update,
  has_table_privilege('service_role', 'public.push_subscriptions', 'delete')   as can_delete;

-- E. Unique constraint exists
select
  conname,
  contype
from pg_constraint
where conrelid = 'public.push_subscriptions'::regclass
  and contype = 'u';

-- ============================================================
-- Rollback SQL
-- ============================================================
-- drop trigger if exists push_subscriptions_set_updated_at
--   on public.push_subscriptions;
-- drop table if exists public.push_subscriptions;
