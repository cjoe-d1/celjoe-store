import type { Metadata } from "next";

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
  getOrderByNumber,
  statusLabel,
} from "lib/supabase/orders";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

type PageProps = {
  params: Promise<{ orderNumber: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return buildMetadata({
    title: `Order ${orderNumber}`,
    description: `Live status of your Celjoe order ${orderNumber}.`,
    path: `/track-order/${orderNumber}`,
    noIndex: true,
  });
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(decodeURIComponent(orderNumber));
  if (!order) notFound();

  const timeline = buildOrderTimeline(order.orderStatus);
  const placedAt = new Date(order.createdAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <PageHeader
        eyebrow={`Order ${order.orderNumber}`}
        title="Your order, in motion"
        description={`Placed ${placedAt} · Status: ${statusLabel(order.orderStatus)}`}
      />

      <Container className="py-[var(--ds-space-12)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-10)] lg:grid-cols-3">
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
          </div>

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
              <Button variant="ghost" asChild>
                <Link href="/track-order">Track another order</Link>
              </Button>
            </div>
          </aside>
        </div>
      </Container>

      <Footer />
    </>
  );
}
