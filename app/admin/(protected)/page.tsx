import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
  StatusPill,
} from "components/chds/admin";
import { Card, Button, SectionTitle, Label } from "components/chds";
import {
  KpiCard,
  ActivityFeed,
  ChartWrapper,
} from "components/chds/dashboard";
import { getOperationsDashboard } from "lib/supabase/admin/dashboard";
import { requireAdmin } from "lib/auth/guards";
import { Suspense } from "react";
import { DashboardSkeleton } from "./orders/skeleton";
import { formatMoney } from "lib/supabase/orders";
import { PushSubscribeButton } from "components/pwa/push-subscribe-button";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Operations dashboard",
  description: "Live state of the Celjoe hospitality operation.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent greetingName={session.fullName} />
    </Suspense>
  );
}

async function DashboardContent({ greetingName }: { greetingName: string }) {
  const dashboard = await getOperationsDashboard();

  return (
    <>
      <AdminTopBar
        title="Good service, hospitality"
        description={`Welcome back, ${greetingName}. Today is ${new Date().toLocaleDateString(
          "en-NG",
          { weekday: "long", day: "numeric", month: "long" },
        )}.`}
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/orders">View live orders</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <section
          aria-label="Key performance indicators"
          className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-4"
        >
          {dashboard.kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
            />
          ))}
        </section>

        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <Card variant="dashboard" className="lg:col-span-2">
            <Label tone="muted">Live order queue</Label>
            <div className="mt-[var(--ds-space-3)] overflow-x-auto">
              <table className="w-full text-left text-[length:var(--ds-text-body)]">
                <thead className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                  <tr>
                    <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">Order</th>
                    <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">Customer</th>
                    <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">Status</th>
                    <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-[var(--ds-space-3)] py-[var(--ds-space-6)] text-center text-[var(--ds-color-muted)]"
                      >
                        No live orders right now.
                      </td>
                    </tr>
                  ) : (
                    dashboard.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-[var(--ds-color-border)] text-[var(--ds-color-fg)]"
                      >
                        <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="hover:text-[var(--ds-color-accent)]"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">
                          {order.customerName}
                        </td>
                        <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">
                          <StatusPill status={order.orderStatus} />
                        </td>
                        <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right">
                          {formatMoney(order.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <ActivityFeed title="Alerts">
            {dashboard.alerts.length === 0 ? (
              <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                All systems calm. Nothing requires your attention.
              </div>
            ) : (
              dashboard.alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.href}
                  className="block rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)] transition-colors hover:border-[var(--ds-color-accent)]"
                >
                  <div className="text-[length:var(--ds-text-caption)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                    {alert.tone}
                  </div>
                  <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                    {alert.title}
                  </div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {alert.description}
                  </div>
                </Link>
              ))
            )}
          </ActivityFeed>
        </div>

        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-2">
          <ChartWrapper title="Today's performance">
            <div className="grid grid-cols-2 gap-[var(--ds-space-4)]">
              <div>
                <div className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {dashboard.recentOrders.filter((o) => o.orderStatus === "ready").length}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  Ready for pickup
                </div>
              </div>
              <div>
                <div className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                  {dashboard.recentOrders.filter((o) => o.orderStatus === "preparing").length}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  In the kitchen
                </div>
              </div>
            </div>
            <SectionTitle className="mt-[var(--ds-space-4)]">
              Quick actions
            </SectionTitle>
            <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-2)]">
              <Button asChild variant="outline">
                <Link href="/admin/kitchen">Open kitchen display</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/inventory">Inventory</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/orders">All orders</Link>
              </Button>
            </div>
            <SectionTitle className="mt-[var(--ds-space-6)]">
              Notifications
            </SectionTitle>
            <div className="mt-[var(--ds-space-2)]">
              <PushSubscribeButton />
            </div>
          </ChartWrapper>

          <Card variant="dashboard">
            <Label tone="muted">Recent customers</Label>
            <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-3)]">
              {dashboard.customers.length === 0 ? (
                <li className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                  No customers yet.
                </li>
              ) : (
                dashboard.customers.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                  >
                    <div>
                      <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                        {c.fullName}
                      </div>
                      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {c.email}
                      </div>
                    </div>
                    <div className="text-right text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      {c.ordersCount} order{c.ordersCount === 1 ? "" : "s"}
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-[var(--ds-space-4)]">
              <Button asChild variant="ghost">
                <Link href="/admin/customers">View all customers</Link>
              </Button>
            </div>
          </Card>
        </div>
      </AdminPageContainer>
    </>
  );
}
