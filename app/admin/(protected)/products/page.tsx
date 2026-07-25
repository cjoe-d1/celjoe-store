import Link from "next/link";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Field, TextInput, Select, Button, Label } from "components/chds";
import { AdminTable, EmptyTable, FilterRow } from "components/chds/table";
import { listAdminProducts, listAdminCategories } from "lib/supabase/admin/catalog";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Products",
  description: "Catalog and Smokehouse products.",
  path: "/admin/products",
  noIndex: true,
});

type SearchParams = Promise<{ q?: string; category?: string; availability?: string; page?: string }>;

export default async function AdminProductsPage(props: { searchParams: SearchParams }) {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "catalog:read");
  const sp = await props.searchParams;
  const q = sp.q ?? "";
  const categoryId = sp.category ?? "";
  const isAvailable =
    sp.availability === "available"
      ? true
      : sp.availability === "unavailable"
        ? false
        : undefined;
  const page = Number(sp.page ?? "1") || 1;

  const [list, categories] = await Promise.all([
    listAdminProducts({ search: q, categoryId, isAvailable, page, pageSize: 20 }),
    listAdminCategories(),
  ]);

  return (
    <>
      <AdminTopBar
        title="Products"
        description="Menu items, Smokehouse offerings, and catering packages."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <FilterRow>
          <form className="flex flex-wrap items-end gap-[var(--ds-space-3)]" method="get">
            <Field label="Search">
              <TextInput name="q" defaultValue={q} placeholder="Product name" />
            </Field>
            <Field label="Category">
              <Select name="category" defaultValue={categoryId}>
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Availability">
              <Select name="availability" defaultValue={sp.availability ?? ""}>
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </Field>
            <Button type="submit">Apply</Button>
            <Button asChild variant="ghost">
              <Link href="/admin/products">Reset</Link>
            </Button>
          </form>
        </FilterRow>

        {list.products.length === 0 ? (
          <EmptyTable
            title="No products match your filters"
            description="Adjust your search, category, or availability."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Product</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Category</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Price</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Status</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.products.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                      <div className="text-[var(--ds-color-fg)]">{p.name}</div>
                      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {p.sku ?? "—"} · {p.preparationTimeMinutes ?? 0}m prep
                      </div>
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      ₦{Number(p.price.amount).toLocaleString("en-NG")}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                      <Label tone="muted">
                        {p.isAvailable ? "Available" : "Unavailable"}
                      </Label>
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${p.id}`}>View</Link>
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
