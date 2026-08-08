import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Container,
  PageHeader,
  StatusIndicator,
} from "components/chds";
import Footer from "components/layout/footer";
import { buildMetadata } from "lib/seo";
import {
  buildOrderTimeline,
  formatMoney,
  fetchOrderItems,
  mapOrderRow,
  mapOrderItemRow,
  statusLabel,
  type Order,
  type OrderLine,
} from "lib/supabase/orders";
import { db } from "lib/supabase/admin";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return buildMetadata({
    title: "Track Order",
    description: "Track your Celjoe order status securely.",
    path: `/track/${token}`,
    noIndex: true,
  });
}

export default async function TrackTokenPage({ params }: PageProps) {
  const { token } = await params;

  if (!token || typeof token !== "string" || token.length < 8) {
    notFound();
  }

  // Look up order by tracking_token using service role (bypasses RLS).
  // The token is cryptographically random — knowing or guessing an order
  // number does NOT grant access.
  const { data: orderData, error: orderErr } = await db
    .from("orders")
    .select("*")
    .eq("tracking_token", token)
    .maybeSingle();

  if (orderErr || !orderData) {
    notFound();
  }

  const items = await fetchOrderItemsViaDb(orderData.id as string);
  const order = mapOrderRow(orderData as Record<string, unknown> as Parameters<typeof mapOrderRow>[0], items);

  const timeline = buildOrderTimeline(order.orderStatus);
  const placedAt = new Date(order.createdAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Extract address fields from raw row (not in Order type)
  const raw = orderData as Record<string, unknown>;
  const deliveryMethod = (raw.delivery_method as string) ?? null;
  const addressLine1 = (raw.address_line1 as string) ?? null;
  const city = (raw.city as string) ?? null;
  const state = (raw.state as string) ?? null;
  const deliveryInstructions = (raw.delivery_instructions as string) ?? null;

  return (
    <>
      <PageHeader
        eyebrow={`Order ${order.orderNumber}`}
        title="Your order, in motion"
        description={`Placed ${placedAt} · Status: ${statusLabel(order.orderStatus)}`}
      />

      <Container className="py-[var(--ds-space-12)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-10)] lg:grid-cols-3">
          {/* Timeline */}
          <div className="lg:col-span-2">
            <ol className="space-y-[var(--ds-space-6)]">
              {timeline.map((event) => {
                const tone = event.isCurrent
                  ? "warning"
                  : event.isComplete
                    ? "success"
                    : "neutral";
                return (
                  <li
                    key={event.status}
                    className="grid grid-cols-[28px_1fr] gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)]"
                  >
                    <div className="flex items-start justify-center pt-1">
                      <StatusIndicator
                        tone={tone}
                        label={event.isCurrent ? "Current" : event.isComplete ? "Done" : "Pending"}
                      />
                    </div>
                    <div>
                      <div className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                        {event.label}
                      </div>
                      <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                        {event.description}
                      </p>
                    </div>
                  </li>
                );
              })}
              {order.orderStatus === "cancelled" ? (
                <li className="rounded-[var(--ds-radius-xl)] border border-[color:var(--ds-color-danger)]/30 bg-[color:var(--ds-color-danger)]/5 p-[var(--ds-space-5)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  This order was cancelled. Reach out if this was a mistake.
                </li>
              ) : null}
            </ol>

            {/* Items */}
            {items.length > 0 ? (
              <div className="mt-[var(--ds-space-8)]">
                <h2 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  Items
                </h2>
                <ul className="mt-[var(--ds-space-4)] space-y-[var(--ds-space-3)]">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-[var(--ds-space-4)] rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)]"
                    >
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
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Summary sidebar */}
          <aside className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-6)]">
            <h2 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
              Summary
            </h2>
            <dl className="mt-[var(--ds-space-4)] space-y-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              <div className="flex justify-between">
                <dt>Items</dt>
                <dd className="text-[var(--ds-color-fg)]">
                  {order.items.length} item{order.items.length === 1 ? "" : "s"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-[var(--ds-color-fg)]">
                  {formatMoney(order.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="text-[var(--ds-color-fg)]">
                  {formatMoney(order.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-[var(--ds-color-border)] pt-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                <dt>Total</dt>
                <dd>{formatMoney(order.total)}</dd>
              </div>
            </dl>

            {/* Delivery info */}
            {deliveryMethod ? (
              <div className="mt-[var(--ds-space-5)]">
                <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                  Delivery
                </div>
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] capitalize">
                  {deliveryMethod === "pickup" ? "Store Pickup" : "Standard Delivery"}
                </p>
                {addressLine1 ? (
                  <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                    {addressLine1}
                    {city ? `, ${city}` : ""}
                    {state ? `, ${state}` : ""}
                  </p>
                ) : null}
                {deliveryInstructions ? (
                  <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {deliveryInstructions}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Payment status */}
            <div className="mt-[var(--ds-space-5)]">
              <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                Payment
              </div>
              <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] capitalize text-[var(--ds-color-fg)]">
                {order.paymentStatus}
              </p>
            </div>

            {order.notes ? (
              <div className="mt-[var(--ds-space-5)]">
                <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                  Notes
                </div>
                <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  {order.notes}
                </p>
              </div>
            ) : null}

            <div className="mt-[var(--ds-space-6)] flex flex-col gap-[var(--ds-space-2)]">
              <Button asChild>
                <Link href="/">Back to the kitchen</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>

      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchOrderItemsViaDb(orderId: string): Promise<OrderLine[]> {
  try {
    const { data, error } = await db
      .from("order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data.map((it: unknown) => mapOrderItemRow(it as Record<string, unknown> as Parameters<typeof mapOrderItemRow>[0]));
  } catch {
    return [];
  }
}
