import type { Metadata } from "next";

import { Alert, Badge, Button } from "components/chds";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell } from "../_shell";
import { statusLabel } from "lib/supabase/orders";
import { listCustomerOrders } from "lib/supabase/customer";
import { getCurrentCustomerSession } from "lib/auth/session";
import { formatMoney } from "lib/supabase/orders";

export const metadata: Metadata = {
  title: "Orders",
  description: "Your Celjoe order history.",
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/orders");
  }
  const orders = await listCustomerOrders();

  return (
    <AccountShell
      current="/account/orders"
      title="Orders"
      description="Order history and live status."
    >
      {orders.length === 0 ? (
        <>
          <Alert tone="info" title="No orders yet">
            When you place an order, it will appear here with live status updates.
          </Alert>
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Button asChild>
              <Link href="/kitchen">Browse the kitchen</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/track-order">Track an order</Link>
            </Button>
          </div>
        </>
      ) : (
        <ul className="flex flex-col gap-[var(--ds-space-3)]">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-[var(--ds-space-3)]">
                <div>
                  <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    Order {o.orderNumber}
                  </p>
                  <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                    {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {formatMoney(o.total)}
                  </p>
                  <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {new Date(o.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>
                <div className="flex items-center gap-[var(--ds-space-3)]">
                  <Badge tone="neutral">{statusLabel(o.status)}</Badge>
                  <Button variant="ghost" asChild>
                    <Link href={`/track-order/${o.orderNumber}`}>Track</Link>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
