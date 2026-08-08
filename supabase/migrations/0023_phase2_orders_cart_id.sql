-- Phase 2 — Add cart_id to orders for post-payment cart clearing
--
-- The settlement function needs to clear the specific cart that was
-- used for this order. Storing cart_id on the order avoids passing
-- internal identifiers through Paystack metadata.

begin;

do $$
begin
  if not public.has_column('orders', 'cart_id') then
    alter table public.orders add column cart_id uuid
      references public.carts(id) on delete set null;

    create index if not exists orders_cart_id_idx
      on public.orders(cart_id)
      where cart_id is not null;
  end if;
end
$$;

commit;
