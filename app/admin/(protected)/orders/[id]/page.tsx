import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
  StatusPill,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getAdminOrderById } from "lib/supabase/admin/orders";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";
import { buildOrderTimeline, formatMoney, statusLabel } from "lib/supabase/orders";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const p = await props.params;
  return buildMetadata({
    title: `Order ${p.id.slice(0, 8)}`,
    path: `/admin/orders/${p.id}`,
    noIndex: true,
  });
}

export default async function AdminOrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "orders:read");
  const { id } = await props.params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const timeline = buildOrderTimeline(order.orderStatus);

  return (
    <>
      <AdminTopBar
        title={`Order ${order.orderNumber}`}
        description={`Created ${new Date(order.createdAt).toLocaleString("en-NG")}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/orders">Back to orders</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <Card variant="dashboard" className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <Label tone="muted">Status</Label>
              <StatusPill status={order.orderStatus} />
            </div>
            <div className="mt-[var(--ds-space-4)] grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2">
              <div>
                <Label tone="muted">Customer</Label>
                <div className="mt-[var(--ds-space-1)] text-[var(--ds-color-fg)]">
                  {order.customerName}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {order.customerEmail}
                </div>
                {order.customerPhone ? (
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {order.customerPhone}
                  </div>
                ) : null}
              </div>
              <div>
                <Label tone="muted">Payment</Label>
                <div className="mt-[var(--ds-space-1)] text-[var(--ds-color-fg)]">
                  {order.paymentStatus} · {order.paymentMethod ?? "—"}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  Subtotal {formatMoney(order.subtotal)}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  Delivery {formatMoney(order.deliveryFee)}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  Tax {formatMoney(order.tax)}
                </div>
                <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  Total {formatMoney(order.total)}
                </div>
              </div>
            </div>
            {order.notes ? (
              <div className="mt-[var(--ds-space-4)]">
                <Label tone="muted">Notes</Label>
                <p className="mt-[var(--ds-space-1)] text-[var(--ds-color-fg)]">
                  {order.notes}
                </p>
              </div>
            ) : null}
            <div className="mt-[var(--ds-space-4)]">
              <Label tone="muted">Items</Label>
              <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-2)]">
                {order.items.length === 0 ? (
                  <li className="text-[var(--ds-color-muted)]">No items.</li>
                ) : (
                  order.items.map((line) => (
                    <li
                      key={line.id}
                      className="flex items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                    >
                      <div>
                        <div className="text-[var(--ds-color-fg)]">
                          {line.productName}
                        </div>
                        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                          {line.variantName ? `${line.variantName} · ` : ""}×{line.quantity}
                        </div>
                      </div>
                      <div className="text-[var(--ds-color-fg)]">
                        {formatMoney(line.lineTotal)}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Timeline</Label>
            <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              {timeline.map((step) => (
                <li
                  key={step.status}
                  className={
                    "rounded-[var(--ds-radius-md)] border p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] " +
                    (step.isCurrent
                      ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]"
                      : step.isComplete
                        ? "border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 text-[var(--ds-color-fg)]"
                        : "border-[var(--ds-color-border)] text-[var(--ds-color-muted)]")
                  }
                >
                  <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                    {step.label}
                  </div>
                  <div>{step.description}</div>
                </li>
              ))}
            </ul>
            <div className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-2)]">
              <Button variant="primary" disabled>
                Mark as preparing
              </Button>
              <Button variant="outline" disabled>
                Assign rider
              </Button>
              <Button variant="ghost" disabled>
                Issue refund
              </Button>
            </div>
            <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {statusLabel(order.orderStatus)} · State changes are recorded in the audit log.
            </p>
          </Card>
        </div>
      </AdminPageContainer>
    </>
  );
}
