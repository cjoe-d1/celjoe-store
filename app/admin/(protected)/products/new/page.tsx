import Link from "next/link";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label } from "components/chds";
import { ProductForm } from "../product-form";
import { getCategories } from "lib/supabase/admin/products";
import { requireAdmin } from "lib/auth/guards";
import { buildMetadata } from "lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Add product",
  description: "Create a new menu, Smokehouse, or catering item.",
  path: "/admin/products/new",
  noIndex: true,
});

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategories();

  return (
    <>
      <AdminTopBar
        title="Add product"
        description="Create a new menu, Smokehouse, or catering item."
        actions={
          <Link
            href="/admin/products"
            className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)] underline-offset-2 hover:underline"
          >
            Back to products
          </Link>
        }
      />
      <AdminPageContainer>
        <Card variant="dashboard">
          <Label tone="muted">Product details</Label>
          <div className="mt-[var(--ds-space-4)]">
            <ProductForm categories={categories} mode="create" />
          </div>
        </Card>
      </AdminPageContainer>
    </>
  );
}
