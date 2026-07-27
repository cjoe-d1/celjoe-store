import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
  StatusPill,
} from "components/chds/admin";
import { Button, Field, TextInput, Select, Label } from "components/chds";
import { AdminTable, EmptyTable, FilterRow, BulkActions } from "components/chds/table";
import {
  Pagination,
  type PaginationModel,
} from "components/chds/navigation";
import { listAdminOrders } from "lib/supabase/admin/orders";
import { formatMoney } from "lib/supabase/orders";
import { requireAdmin } from "lib/auth/guards";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Orders",
  description: "Live and historical orders.",
  path: "/admin/orders",
  noIndex: true,
});

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

type SearchParams = Promise<{
  status?: string;
  q?: string;
  page?: string;
}>;

export default async function AdminOrdersPage(props: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const sp = await props.searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof STATUSES)[number])
    : "all";
  const q = sp.q ?? "";
  const page = Number(sp.page ?? "1") || 1;

  return (
    <>
      <AdminTopBar
        title="Orders"
        description="Live and historical orders across the kitchen and Smokehouse."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/kitchen">Open kitchen display</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <FilterRow>
          <form className="flex flex-wrap items-center gap-[var(--ds-space-3)]" method="get">
            <Field label="Search">
              <TextInput
                name="q"
                defaultValue={q}
                placeholder="Order #, customer, email"
              />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={status}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <input type="hidden" name="page" value="1" />
            <Button type="submit" variant="primary">
              Apply
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/orders">Reset</Link>
            </Button>
          </form>
        </FilterRow>

        <BulkActions>
          <Label tone="muted">Bulk actions</Label>
          <Button variant="outline" disabled>
            Mark as preparing
          </Button>
          <Button variant="outline" disabled>
            Mark as completed
          </Button>
          <Button variant="outline" disabled>
            Export CSV
          </Button>
        </BulkActions>

        <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-[var(--ds-radius-xl)] bg-[var(--ds-color-border)]/40" />}>
          <OrdersList status={status} q={q} page={page} />
        </Suspense>
      </AdminPageContainer>
    </>
  );
}

async function OrdersList({
  status,
  q,
  page,
}: {
  status: string;
  q: string;
  page: number;
}) {
  const result = await listAdminOrders({
    status: status as
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "completed"
      | "cancelled"
      | "all",
    search: q,
    page,
    pageSize: 20,
  });

  if (result.orders.length === 0) {
    return (
      <EmptyTable
        title="No orders match these filters."
        description="Try a different search or clear the filters to see all orders."
      />
    );
  }

  const pagination: PaginationModel = {
    currentPage: result.page,
    totalPages: result.totalPages,
  };

  return (
    <>
      <AdminTable>
        <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
          <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
            <tr>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Order</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Customer</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Status</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Total</th>
              <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.orders.map((o) => (
              <tr key={o.id} className="border-t border-[var(--ds-color-border)]">
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-[var(--ds-color-fg)] hover:text-[var(--ds-color-accent)]"
                  >
                    {o.orderNumber}
                  </Link>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {new Date(o.createdAt).toLocaleString("en-NG")}
                  </div>
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <div className="text-[var(--ds-color-fg)]">{o.customerName}</div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {o.customerEmail}
                  </div>
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                  <StatusPill status={o.orderStatus} />
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                  {formatMoney(o.total)}
                </td>
                <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/orders/${o.id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>
      {pagination.totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination
            model={pagination}
            onPageChange={() => {
              // Server-side: navigation handled via form/links
            }}
          />
        </div>
      ) : null}
    </>
  );
}
