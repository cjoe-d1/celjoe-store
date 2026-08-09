import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button, Badge } from "components/chds";
import { AccountShell } from "../../_shell";
import {
  buildOrderTimeline,
  formatMoney,
  mapOrderRow,
  mapOrderItemRow,
  statusLabel,
  type OrderLine,
} from "lib/supabase/orders";
import { getCurrentCustomerSession } from "lib/auth/session";
import { db } from "lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `Order ${orderNumber}`,
    description: `View order ${orderNumber} details.`,
    robots: { index: false },
  };
}

export default async function CustomerOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/orders/" + orderNumber);
  }

  // Resolve customer_id from the customers table
  const { data: cust } = await db
    .from("customers")
    .select("id")
    .eq("auth_user_id", session.userId)
    .maybeSingle();

  if (!cust?.id) {
    return (
      <AccountShell current="/account/orders" title="Account not found" description="">
        <p className="text-[var(--ds-color-muted)]">
          Please complete your account registration first.
        </p>
      </AccountShell>
    );
  }

  // Fetch order — must belong to the authenticated customer
  const { data: orderData, error } = await db
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .eq("customer_id", cust.id)
    .maybeSingle();

  if (error || !orderData) {
    notFound();
  }

  // Fetch items
  const { data: itemData } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderData.id)
    .order("created_at", { ascending: true });

  const items: OrderLine[] = (itemData ?? []).map((it: unknown) =>
    mapOrderItemRow(it as unknown as Record<string, unknown> as Parameters<typeof mapOrderItemRow>[0]),
  );

  const order = mapOrderRow(orderData as unknown as Record<string, unknown> as Parameters<typeof mapOrderRow>[0], items);
  const timeline = buildOrderTimeline(order.orderStatus);
  const raw = orderData as Record<string, unknown>;

  return (
    <AccountShell
      current="/account/orders"
      title={`Order ${orderNumber}`}
      description={`Placed ${new Date(order.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}`}
    >
      {/* Status badge */}
      <div className="flex flex-wrap items-center gap-[var(--ds-space-3)]">
        <Badge tone="neutral">{statusLabel(order.orderStatus)}</Badge>
        <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)] capitalize">
          Payment: {order.paymentStatus}
        </span>
      </div>

      {/* Timeline */}
      <div className="mt-[var(--ds-space-6)]">
        <h3 className="text-[length:var(--ds-text-h5)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Order status
        </h3>
        <ol className="mt-[var(--ds-space-3)] space-y-[var(--ds-space-3)]">
          {timeline.map((event) => {
                const tone = event.isCurrent ? "neutral" : event.isComplete ? "success" : "neutral";
                return (
              <li key={event.status} className="flex items-center gap-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                <Badge tone={tone}>{event.isCurrent ? "Current" : event.isComplete ? "Done" : "Pending"}</Badge>
                {event.label}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Items */}
      <div className="mt-[var(--ds-space-6)]">
        <h3 className="text-[length:var(--ds-text-h5)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Items ordered
        </h3>
        <ul className="mt-[var(--ds-space-3)] divide-y divide-[var(--ds-color-border)]">
          {items.length === 0 ? (
            <li className="py-[var(--ds-space-3)] text-[var(--ds-color-muted)] text-[length:var(--ds-text-caption)]">
              No items found for this order.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="flex justify-between gap-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                <div className="min-w-0 flex-1">
                  <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {item.productName}
                  </div>
                  {item.variantName ? (
                    <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      {item.variantName}
                    </div>
                  ) : null}
                  <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-small)] text-[var(--ds-color-muted)]">
                    Qty: {item.quantity} &times; {formatMoney(item.unitPrice)}
                  </div>
                </div>
                <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] shrink-0">
                  {formatMoney(item.lineTotal)}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Totals */}
      <div className="mt-[var(--ds-space-6)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-4)]">
        <dl className="space-y-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="text-[var(--ds-color-fg)]">{formatMoney(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery fee</dt>
            <dd className="text-[var(--ds-color-fg)]">{formatMoney(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-[var(--ds-color-border)] pt-[var(--ds-space-2)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            <dt>Total</dt>
            <dd>{formatMoney(order.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Delivery info */}
      {raw.delivery_method ? (
        <div className="mt-[var(--ds-space-6)]">
          <h3 className="text-[length:var(--ds-text-h5)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            Delivery
          </h3>
          <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)] capitalize">
            {raw.delivery_method === "pickup" ? "Store pickup" : "Standard delivery"}
          </p>
          {(raw.address_line1 as string) ? (
            <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              {raw.address_line1 as string}
              {raw.city ? `, ${raw.city}` : ""}
              {raw.state ? `, ${raw.state}` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-[var(--ds-space-8)] flex flex-wrap gap-[var(--ds-space-3)]">
        <Button asChild variant="primary">
          <Link href={`/receipt/${(raw.tracking_token as string) ?? order.trackingToken}`}>View receipt</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={`/track/${(raw.tracking_token as string) ?? order.trackingToken}`}>
            Track this order
          </Link>
        </Button>
      </div>
    </AccountShell>
  );
}
