import Link from "next/link";
import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Label, Button, Card } from "components/chds";
import { AdminTable, EmptyTable } from "components/chds/table";
import { listIngredients, listSuppliers } from "lib/supabase/admin/catalog";
import { requireAdmin } from "lib/auth/guards";
import { formatMoneyExact } from "lib/supabase/orders";
import { NewIngredientForm } from "./new-ingredient-form";
import { NewSupplierForm } from "./new-supplier-form";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Inventory",
  description: "Ingredients, suppliers, stock, and waste.",
  path: "/admin/inventory",
  noIndex: true,
});

export default async function AdminInventoryPage() {
  await requireAdmin();
  const [ingredients, suppliers] = await Promise.all([
    listIngredients(),
    listSuppliers(),
  ]);

  const lowStock = ingredients.filter(
    (i) => i.stock <= i.lowStockThreshold,
  );

  return (
    <>
      <AdminTopBar
        title="Inventory"
        description="Ingredients, suppliers, and stock movements."
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-2">
          <NewIngredientForm />
          <NewSupplierForm />
        </div>

        {lowStock.length > 0 ? (
          <Card variant="dashboard">
            <Label tone="muted">Low stock alerts</Label>
            <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              {lowStock.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-warning)]/30 bg-[var(--ds-color-warning)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
                >
                  <span>{i.name}</span>
                  <span>
                    {i.stock} {i.unit} / threshold {i.lowStockThreshold}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {ingredients.length === 0 ? (
          <EmptyTable
            title="No ingredients yet"
            description="Add your first ingredient using the form above."
          />
        ) : (
          <AdminTable>
            <table className="w-full border-collapse text-left text-[length:var(--ds-text-body)]">
              <thead className="bg-[var(--ds-color-surface-muted)] text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Ingredient</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Stock</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Unit</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Cost</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Valuation</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)]">Supplier</th>
                  <th className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--ds-color-border)]">
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {i.name}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {i.stock}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-fg)]">
                      {i.unit}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {formatMoneyExact(i.costPerUnit)}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right text-[var(--ds-color-fg)]">
                      {formatMoneyExact(i.stock * i.costPerUnit)}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
                      {i.supplier ?? "—"}
                    </td>
                    <td className="px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/inventory/${i.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminTable>
        )}

        <Card variant="dashboard">
          <Label tone="muted">Suppliers</Label>
          {suppliers.length === 0 ? (
            <p className="mt-[var(--ds-space-2)] text-[var(--ds-color-muted)]">No suppliers yet.</p>
          ) : (
            <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              {suppliers.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                >
                  <div>
                    <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                      {s.name}
                    </div>
                    <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      {s.contact ?? ""} {s.phone ? `· ${s.phone}` : ""}
                    </div>
                  </div>
                  {s.email ? (
                    <a
                      className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-accent)] hover:underline"
                      href={`mailto:${s.email}`}
                    >
                      {s.email}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </AdminPageContainer>
    </>
  );
}
