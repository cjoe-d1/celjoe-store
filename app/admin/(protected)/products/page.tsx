import Link from "next/link";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getProducts } from "lib/supabase/admin/products";
import { requireAdmin } from "lib/auth/guards";
import { buildMetadata } from "lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Products",
  description: "Manage the Celjoe menu, Smokehouse, and catering items.",
  path: "/admin/products",
  noIndex: true,
});

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getProducts();

  return (
    <>
      <AdminTopBar
        title="Products"
        description="Manage the menu, Smokehouse, and catering items."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/products/new">Add product</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        {products.length === 0 ? (
          <Card variant="dashboard">
            <div className="py-[var(--ds-space-12)] text-center">
              <Label tone="muted">No products yet</Label>
              <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Click &ldquo;Add product&rdquo; to create your first menu item.
              </p>
            </div>
          </Card>
        ) : (
          <Card variant="dashboard" className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[length:var(--ds-text-body)]">
                <thead>
                  <tr className="border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)]">
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Name
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Category
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Price
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Status
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Available
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-muted)]">
                      Featured
                    </th>
                    <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ds-color-border)]">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      className={
                        "hover:bg-[var(--ds-color-surface-muted)] " +
                        (p.is_archived ? "opacity-50" : "")
                      }
                    >
                      <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                        <div className="flex flex-col">
                          <span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                            {p.name}
                          </span>
                          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                            /{p.slug}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {p.primary_category?.name ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                        ₦{p.price.toFixed(2)}
                        {p.discount_price ? (
                          <span className="ml-[var(--ds-space-1)] text-[var(--ds-color-muted)] line-through">
                            ₦{p.discount_price.toFixed(2)}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)]">
                        <span
                          className={
                            "rounded-full px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] " +
                            (p.status === "active"
                              ? "bg-[var(--ds-color-success)]/10 text-[var(--ds-color-success)]"
                              : "bg-[var(--ds-color-surface-muted)] text-[var(--ds-color-muted)]")
                          }
                        >
                          {p.status}
                        </span>
                        {p.is_archived ? (
                          <span className="ml-[var(--ds-space-1)] rounded-full bg-[var(--ds-color-warning)]/10 px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-warning)]">
                            archived
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                        {p.is_available ? "Yes" : "No"}
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                        {p.is_featured ? "Yes" : "—"}
                      </td>
                      <td className="whitespace-nowrap px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="text-[var(--ds-color-accent)] underline-offset-2 hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </AdminPageContainer>
    </>
  );
}
