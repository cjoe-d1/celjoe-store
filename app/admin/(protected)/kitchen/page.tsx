import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
  StatusPill,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { listAdminOrders } from "lib/supabase/admin/orders";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Kitchen display",
  description: "Live ticket queue for the kitchen.",
  path: "/admin/kitchen",
  noIndex: true,
});

export default async function AdminKitchenPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "kitchen:read");

  const [queue, ready, completed] = await Promise.all([
    listAdminOrders({ status: "preparing", pageSize: 12 }),
    listAdminOrders({ status: "ready", pageSize: 12 }),
    listAdminOrders({ status: "delivered", pageSize: 8 }),
  ]);

  return (
    <>
      <AdminTopBar
        title="Kitchen display"
        description="Active tickets across the kitchen and Smokehouse."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/orders">All orders</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <Section title="Preparing" orders={queue.orders} tone="preparing" />
          <Section title="Ready" orders={ready.orders} tone="ready" />
          <Section title="Recently delivered" orders={completed.orders} tone="delivered" />
        </div>
      </AdminPageContainer>
    </>
  );
}

function Section({
  title,
  orders,
  tone,
}: {
  title: string;
  orders: Awaited<ReturnType<typeof listAdminOrders>>["orders"];
  tone: "preparing" | "ready" | "delivered";
}) {
  return (
    <div>
      <div className="mb-[var(--ds-space-3)] flex items-center justify-between">
        <Label tone="muted">{title}</Label>
        <span className="rounded-full bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          {orders.length}
        </span>
      </div>
      <div className="flex flex-col gap-[var(--ds-space-3)]">
        {orders.length === 0 ? (
          <Card variant="order" className="text-center text-[var(--ds-color-muted)]">
            No tickets here right now.
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} variant="order" className="flex flex-col gap-[var(--ds-space-2)]">
              <div className="flex items-center justify-between">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] hover:text-[var(--ds-color-accent)]"
                >
                  {order.orderNumber}
                </Link>
                <StatusPill status={tone} />
              </div>
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                {order.customerName} · {new Date(order.createdAt).toLocaleTimeString("en-NG")}
              </div>
              <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
                {(order.items ?? []).slice(0, 6).map((line) => (
                  <li key={line.id} className="flex items-center justify-between">
                    <span>
                      {line.productName}
                      {line.variantName ? ` (${line.variantName})` : ""}
                    </span>
                    <span className="text-[var(--ds-color-muted)]">×{line.quantity}</span>
                  </li>
                ))}
              </ul>
              {order.notes ? (
                <p className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
                  Note: {order.notes}
                </p>
              ) : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
