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

  // Default range: last 30 days, date-only strings for the inputs
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
    .toISOString()
    .slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  const initialFrom = sp.from || defaultFrom;
  const initialTo = sp.to || defaultTo;

  // Full-range ISO timestamps for the initial server-side data fetch
  const fromISO = new Date(
    new Date(initialFrom).getFullYear(),
    new Date(initialFrom).getMonth(),
    new Date(initialFrom).getDate(),
  ).toISOString();
  const toISO = new Date(
    new Date(initialTo).getFullYear(),
    new Date(initialTo).getMonth(),
    new Date(initialTo).getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();

  const [ordersPage, productsList] = await Promise.all([
    listAdminOrders({ pageSize: 200, dateFrom: fromISO, dateTo: toISO }),
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
              initialFrom={initialFrom}
              initialTo={initialTo}
              initialOrders={ordersPage.orders}
              products={productsList.products}
            />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
