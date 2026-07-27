import Link from "next/link";
import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar, StatusPill } from "components/chds/admin";
import { Label, Button, Card } from "components/chds";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listAdminCustomers } from "lib/supabase/admin/customers";
import { requireAdmin } from "lib/auth/guards";
import { formatMoney } from "lib/supabase/orders";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Customers",
  description: "Customer profiles, addresses, and history.",
  path: "/admin/customers",
  noIndex: true,
});

export default async function AdminCustomersPage(props: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  await requireAdmin();
  const sp = await props.searchParams;
  const list = await listAdminCustomers({ search: sp.q ?? "" });

  return (
    <>
      <AdminTopBar
        title="Customers"
        description="Customer profiles, orders, addresses, and loyalty."
      />
      <AdminPageContainer>
        <form
          method="get"
          className="mb-[var(--ds-space-4)] flex flex-wrap items-end gap-[var(--ds-space-3)]"
        >
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search by name or email"
            className="flex-1 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          />
          <Button type="submit">Search</Button>
        </form>

        {list.customers.length === 0 ? (
          <EmptyTable title="No customers match" description="Try a different search." />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Customer</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Tier</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Orders</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Spend</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Flags</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.customers.map((c) => (
                  <tr key={c.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      <Link href={`/admin/customers/${c.id}`} className="hover:text-[var(--ds-color-accent)]">
                        {c.fullName}
                      </Link>
                      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {c.email}
                      </div>
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {c.loyaltyTier ?? "regular"}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {c.ordersCount}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {formatMoney(Number(c.totalSpend?.amount ?? 0))}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                      {c.isVip ? <Label tone="muted">VIP</Label> : null}
                      {c.isBlacklisted ? (
                        <Label tone="muted" className="ml-[var(--ds-space-1)]">Blacklisted</Label>
                      ) : null}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/customers/${c.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}
      </AdminPageContainer>
    </>
  );
}
