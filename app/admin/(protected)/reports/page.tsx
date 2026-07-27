import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label } from "components/chds";
import { requireAdmin } from "lib/auth/guards";
import { ReportsExplorer } from "./explorer";
import { listAdminOrders } from "lib/supabase/admin/orders";
import { listAdminProducts } from "lib/supabase/admin/catalog";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Reports",
  description: "Revenue, orders, products, customers.",
  path: "/admin/reports",
  noIndex: true,
});

export default async function AdminReportsPage(props: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireAdmin();

  const sp = await props.searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  const from = sp.from || defaultFrom;
  const to = sp.to || defaultTo;

  const [ordersPage, productsList] = await Promise.all([
    listAdminOrders({ pageSize: 200 }),
    listAdminProducts(),
  ]);

  return (
    <>
      <AdminTopBar
        title="Reports"
        description="Date-filtered insights across revenue, orders, products, and customers."
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">Reports</Label>
          <div className="mt-[var(--ds-space-4)]">
            <ReportsExplorer
              from={from}
              to={to}
              orders={ordersPage.orders}
              products={productsList.products}
            />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
