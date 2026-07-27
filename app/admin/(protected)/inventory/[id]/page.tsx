import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "lib/seo";
import {
  AdminPageContainer,
  AdminTopBar,
} from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { getIngredientById, getStockMovements } from "lib/supabase/admin/products";
import { requireAdmin } from "lib/auth/guards";
import { formatMoneyExact } from "lib/supabase/orders";
import { InventoryActions } from "./inventory-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const p = await props.params;
  return buildMetadata({
    title: `Ingredient ${p.id.slice(0, 8)}`,
    path: `/admin/inventory/${p.id}`,
    noIndex: true,
  });
}

export default async function AdminIngredientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;
  const [ingredient, movements] = await Promise.all([
    getIngredientById(id),
    getStockMovements(id),
  ]);
  if (!ingredient) notFound();

  const lowStock = ingredient.stock <= ingredient.lowStockThreshold;

  return (
    <>
      <AdminTopBar
        title={ingredient.name}
        description={`${ingredient.stock} ${ingredient.unit} · cost ${formatMoneyExact(ingredient.costPerUnit)}/${ingredient.unit}`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/inventory">Back to inventory</Link>
          </Button>
        }
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-[var(--ds-space-4)]">
            <Card variant="dashboard">
              <Label tone="muted">Stock movements</Label>
              {movements.length === 0 ? (
                <p className="mt-[var(--ds-space-2)] text-[var(--ds-color-muted)]">No movements yet.</p>
              ) : (
                <ul className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
                  {movements.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
                    >
                      <div>
                        <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                          {m.type}
                        </div>
                        <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                          {new Date(m.createdAt).toLocaleString("en-NG")}
                          {m.note ? ` · ${m.note}` : ""}
                        </div>
                      </div>
                      <div className={m.quantity >= 0 ? "text-[var(--ds-color-success)]" : "text-[var(--ds-color-danger)]"}>
                        {m.quantity > 0 ? "+" : ""}
                        {m.quantity} {ingredient.unit}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <div className="flex flex-col gap-[var(--ds-space-4)]">
            <Card variant="dashboard">
              <Label tone="muted">Stock</Label>
              <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)] text-[length:var(--ds-text-body)]">
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Current</span>
                  <span className="text-[var(--ds-color-fg)]">
                    {ingredient.stock} {ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Threshold</span>
                  <span className="text-[var(--ds-color-fg)]">{ingredient.lowStockThreshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Cost / unit</span>
                  <span className="text-[var(--ds-color-fg)]">{formatMoneyExact(ingredient.costPerUnit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-color-muted)]">Valuation</span>
                  <span className="text-[var(--ds-color-fg)]">
                    {formatMoneyExact(ingredient.stock * ingredient.costPerUnit)}
                  </span>
                </div>
                {lowStock ? (
                  <div className="mt-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-warning)]/30 bg-[var(--ds-color-warning)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
                    Low stock alert
                  </div>
                ) : null}
              </div>
            </Card>
            <InventoryActions ingredient={ingredient} />
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}
