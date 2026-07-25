import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listAdminCustomers } from "lib/supabase/admin/customers";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Customers",
  description: "Celjoe customer directory.",
  path: "/admin/customers",
  noIndex: true,
});

export default async function AdminCustomersPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "orders:read");
  const customers = await listAdminCustomers();

  return (
    <>
      <AdminTopBar
        title="Customers"
        description="Guest directory, loyalty, and engagement history."
        actions={
          <Button variant="outline" disabled>
            Export CSV
          </Button>
        }
      />
      <AdminPageContainer>
        {customers.length === 0 ? (
          <EmptyTable
            title="No customers yet"
            description="Customers will appear here once the orders pipeline is in production."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Customer</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Email</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Orders</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Spend</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Tier</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {c.fullName}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {c.email}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {c.ordersCount}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      ₦{Number(c.totalSpend.amount).toLocaleString("en-NG")}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                      <Label tone="muted">{c.loyaltyTier}</Label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}

        <Card variant="dashboard">
          <Label tone="muted">Loyalty programme</Label>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Foundation in place. Tier thresholds, points, and rewards are configurable
            in the operations settings panel.
          </p>
        </Card>
      </AdminPageContainer>
    </>
  );
}
