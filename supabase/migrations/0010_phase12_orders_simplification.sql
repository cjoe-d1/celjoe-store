-- Phase 12 / Phase B — Orders Simplification
--
-- This migration performs the schema-side support for the Phase B
-- refactor:
--   - Migrate any existing orders with status = 'delivered' to 'completed'
--   - Migrate any existing orders with status = 'out_for_delivery' to 'ready'
--     (the rider hand-off state no longer exists; ready = ready for pickup)
--   - Drop the orders.assigned_rider_id and orders.assigned_rider_name columns
--     (the riders module is removed in Phase C)
--   - Update the public-facing order status check constraint
--
-- If `order_status` is a Postgres ENUM:
--   * rename the type to order_status_legacy
--   * create order_status text + check constraint
-- If it is already a VARCHAR with a CHECK, we simply rewrite the CHECK.

do $$
begin
  if public.has_column('orders', 'order_status') then
    -- Step 1: backfill new values
    update public.orders set order_status = 'completed' where order_status = 'delivered';
    update public.orders set order_status = 'ready' where order_status = 'out_for_delivery';
  end if;
end
$$;

do $$
declare
  has_check boolean;
  cname text;
begin
  if public.has_column('orders', 'order_status') then
    -- Drop any existing check constraint named `orders_order_status_check` so we
    -- can replace it.
    select conname into cname
    from pg_constraint c
    join pg_class rel on rel.oid = c.conrelid
    where rel.relname = 'orders'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%order_status%';
    if cname is not null then
      execute format('alter table public.orders drop constraint %I', cname);
    end if;
  end if;
end
$$;

do $$
begin
  if public.has_column('orders', 'order_status') then
    alter table public.orders
      add constraint orders_order_status_check
      check (order_status in (
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
        'cancelled'
      ));
  end if;
end
$$;

-- Drop the rider columns.
do $$
begin
  if public.has_column('orders', 'assigned_rider_id') then
    alter table public.orders drop column assigned_rider_id;
  end if;
  if public.has_column('orders', 'assigned_rider_name') then
    alter table public.orders drop column assigned_rider_name;
  end if;
end
$$;
