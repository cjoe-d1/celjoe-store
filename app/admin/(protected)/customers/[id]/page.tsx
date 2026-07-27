import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getCustomerById, getCustomerOrders } from "lib/supabase/admin/settings";
import { requireAdmin } from "lib/auth/guards";
import { formatMoney } from "lib/supabase/orders";
import { CustomerForm } from "./customer-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const p = await props.params;
  return buildMetadata({
    title: `Customer ${p.id.slice(0, 8)}`,
    path: `/admin/customers/${p.id}`,
    noIndex: true,
  });
}

export default async function AdminCustomerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;
  const [customer, orders] = await Promise.all([
    getCustomerById(id),
    getCustomerOrders(id),
  ]);
  if (!customer) notFound();

  return (
    <>
      <AdminTopBar
        title={customer.fullName}
        description={`${customer.email} · ${customer.ordersCount} orders · ${formatMoney(customer.totalSpend)} lifetime`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/customers">Back to customers</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-[var(--ds-space-4)]">
            <Card variant="dashboard">
              <Label tone="muted">Profile</Label>
              <div className="mt-[var(--ds-space-4)]">
                <CustomerForm customer={customer} />
              </div>
            </Card>

            <Card variant="dashboard">
              <Label tone="muted">Order history</Label>
              {orders.length === 0 ? (
                <p className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                  No orders yet.
                </p>
              ) : (
                <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                    >
                      <div>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] hover:text-[var(--ds-color-accent)]"
                        >
                          {o.orderNumber}
                        </Link>
                        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                          {new Date(o.createdAt).toLocaleString("en-NG")} · {o.status}
                        </div>
                      </div>
                      <div className="text-[var(--ds-color-fg)]">{formatMoney(o.total)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-[var(--ds-space-4)]">
            <Card variant="dashboard">
              <Label tone="muted">Tags & status</Label>
              <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)] text-[length:var(--ds-text-body)]">
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Loyalty tier</span>
                  <span className="text-[var(--ds-color-fg)]">{customer.loyaltyTier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">VIP</span>
                  <span className="text-[var(--ds-color-fg)]">{customer.isVip ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Blacklisted</span>
                  <span className="text-[var(--ds-color-fg)]">{customer.isBlacklisted ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Marketing</span>
                  <span className="text-[var(--ds-color-fg)]">
                    {customer.marketingConsent ? "Consented" : "No"}
                  </span>
                </div>
                {customer.tags.length > 0 ? (
                  <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-1)]">
                    {customer.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Card>

            <Card variant="dashboard">
              <Label tone="muted">Addresses</Label>
              {customer.addresses.length === 0 ? (
                <p className="mt-[var(--ds-space-2)] text-[var(--ds-color-muted)]">No addresses on file.</p>
              ) : (
                <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-2)]">
                  {customer.addresses.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]"
                    >
                      <div className="text-[length:var(--ds-text-body)]">
                        {a.label} {a.isDefault ? "(default)" : ""}
                      </div>
                      <div className="text-[var(--ds-color-muted)]">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}
                      </div>
                      <div className="text-[var(--ds-color-muted)]">
                        {a.city}, {a.state} {a.postalCode ?? ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}
