import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { listIngredients, listSuppliers } from "lib/supabase/admin/catalog";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Inventory",
  description: "Ingredients, suppliers, and stock.",
  path: "/admin/inventory",
  noIndex: true,
});

export default async function AdminInventoryPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "kitchen:read");

  const [ingredients, suppliers] = await Promise.all([
    listIngredients(),
    listSuppliers(),
  ]);

  const lowStock = ingredients.filter((i) => i.stock <= i.lowStockThreshold);

  return (
    <>
      <AdminTopBar
        title="Inventory"
        description="Ingredients, suppliers, and stock health."
        actions={
          <Button variant="primary" disabled>
            New purchase order
          </Button>
        }
      />
      <AdminPageContainer>
        {lowStock.length > 0 ? (
          <Card variant="dashboard" className="border-[var(--ds-color-accent)]/30">
            <Label tone="muted">Low stock</Label>
            <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
              {lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between">
                  <span>{i.name}</span>
                  <span className="text-[var(--ds-color-muted)]">
                    {i.stock} {i.unit} · threshold {i.lowStockThreshold}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <KpiTile label="Ingredients" value={String(ingredients.length)} />
          <KpiTile label="Suppliers" value={String(suppliers.length)} />
          <KpiTile label="Low stock" value={String(lowStock.length)} tone="warning" />
        </div>

        <Card variant="dashboard">
          <Label tone="muted">Ingredients</Label>
          {ingredients.length === 0 ? (
            <p className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
              No ingredients tracked yet.
            </p>
          ) : (
            <table className="mt-[var(--ds-space-3)] w-full text-left text-[length:var(--ds-text-body)]">
              <thead className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
                <tr>
                  <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">Ingredient</th>
                  <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">Supplier</th>
                  <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right">Stock</th>
                  <th className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--ds-color-border)] text-[var(--ds-color-fg)]">
                    <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)]">{i.name}</td>
                    <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[var(--ds-color-muted)]">
                      {i.supplier ?? "—"}
                    </td>
                    <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right">
                      {i.stock} {i.unit}
                    </td>
                    <td className="px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-right text-[var(--ds-color-muted)]">
                      {i.lowStockThreshold}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card variant="dashboard">
          <Label tone="muted">Suppliers</Label>
          {suppliers.length === 0 ? (
            <p className="mt-[var(--ds-space-3)] text-[var(--ds-color-muted)]">
              No suppliers yet.
            </p>
          ) : (
            <ul className="mt-[var(--ds-space-3)] grid grid-cols-1 gap-[var(--ds-space-2)] sm:grid-cols-2">
              {suppliers.map((s) => (
                <li
                  key={s.id}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                >
                  <div className="text-[var(--ds-color-fg)]">{s.name}</div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {s.email ?? s.phone ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </AdminPageContainer>
    </>
  );
}

function KpiTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <Card variant="dashboard" className="text-center">
      <div className="text-[length:var(--ds-text-label)] uppercase tracking-wide text-[var(--ds-color-muted)]">
        {label}
      </div>
      <div
        className={
          "mt-[var(--ds-space-2)] text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] " +
          (tone === "warning" ? "text-[var(--ds-color-accent)]" : "text-[var(--ds-color-fg)]")
        }
      >
        {value}
      </div>
    </Card>
  );
}
