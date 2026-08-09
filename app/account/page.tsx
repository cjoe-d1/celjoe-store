import type { Metadata } from "next";

import { Badge, Button, KpiCard } from "components/chds";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountShell } from "./_shell";
import { getCurrentCustomerSession } from "lib/auth/session";
import { listCustomerAddresses, listCustomerOrders } from "lib/supabase/customer";
import { statusLabel } from "lib/supabase/orders";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Your CELJOE Grills & Juicebar account — orders, addresses, saved meals, notifications, and preferences.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account");
  }
  const addresses = await listCustomerAddresses();
  const orders = await listCustomerOrders();
  const recentOrder = orders[0] ?? null;
  const addressCount = addresses.length;

  return (
    <AccountShell
      current="/account"
      title="Overview"
      description="Your account, your orders, your preferences — all in one quiet place."
    >
      <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
        <KpiCard
          label="Recent order"
          value={recentOrder ? recentOrder.orderNumber : "—"}
          hint={
            recentOrder
              ? `${statusLabel(recentOrder.status)} · ${new Date(recentOrder.createdAt).toLocaleDateString("en-NG")}`
              : "Place an order to see it here."
          }
        />
        <KpiCard label="Saved meals" value="0" hint="Save meals to reorder in a tap." />
        <KpiCard
          label="Addresses"
          value={String(addressCount)}
          hint={
            addressCount > 0
              ? `${addressCount} saved on file`
              : "Add a delivery address to speed up checkout."
          }
        />
        <KpiCard label="Loyalty" value="Coming soon" hint="A rewards programme is on the way." />
      </div>

      {orders.length > 0 ? (
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                Recent orders
              </h3>
              <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                Your last {Math.min(orders.length, 3)} {orders.length === 1 ? "order" : "orders"}.
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/account/orders">View all</Link>
            </Button>
          </div>
          <ul className="mt-[var(--ds-space-5)] flex flex-col gap-[var(--ds-space-3)]">
            {orders.slice(0, 3).map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]"
              >
                <div>
                  <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {o.orderNumber}
                  </p>
                  <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {o.itemCount} {o.itemCount === 1 ? "item" : "items"} ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="flex items-center gap-[var(--ds-space-3)]">
                  <Badge tone="neutral">{statusLabel(o.status)}</Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/track-order/${o.orderNumber}`}>Track</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : addressCount === 0 ? (
        <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
          <h3 className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            Add a delivery address
          </h3>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            With a saved address, checkout takes a single tap.
          </p>
          <div className="mt-[var(--ds-space-4)]">
            <Button asChild>
              <Link href="/account/addresses">Add an address</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </AccountShell>
  );
}
