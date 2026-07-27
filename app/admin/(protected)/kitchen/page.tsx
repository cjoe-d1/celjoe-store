import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Button, Card, Label } from "components/chds";
import { listAdminOrders } from "lib/supabase/admin/orders";
import { requireAdmin } from "lib/auth/guards";
import { formatMoney } from "lib/supabase/orders";
import { KitchenTicketCard } from "./ticket-card";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Kitchen display",
  description: "Live ticket queue for the kitchen and Smokehouse.",
  path: "/admin/kitchen",
  noIndex: true,
});

export default async function AdminKitchenPage() {
  await requireAdmin();

  const [queue, ready, completed] = await Promise.all([
    listAdminOrders({ status: "preparing", pageSize: 12 }),
    listAdminOrders({ status: "ready", pageSize: 12 }),
    listAdminOrders({ status: "completed", pageSize: 8 }),
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
          <Section title="Preparing" tone="preparing" orders={queue.orders} />
          <Section title="Ready" tone="ready" orders={ready.orders} />
          <Section title="Recently completed" tone="completed" orders={completed.orders} />
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
  tone: "preparing" | "ready" | "completed";
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
            <KitchenTicketCard
              key={order.id}
              order={order}
              tone={tone}
              totalLabel={formatMoney(order.total)}
            />
          ))
        )}
      </div>
    </div>
  );
}
