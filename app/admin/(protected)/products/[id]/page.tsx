import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button } from "components/chds";
import { ProductForm } from "../product-form";
import { getProductById, getCategories } from "lib/supabase/admin/products";
import { listAdminProductImages } from "lib/supabase/admin/product-images";
import { listAdminProductVariants } from "lib/supabase/admin/variants";
import { VariantsEditor } from "components/admin/variants-editor";
import { requireAdmin } from "lib/auth/guards";
import { buildMetadata } from "lib/seo";
import {
  archiveProductAction,
  restoreProductAction,
  deleteProductAction,
  duplicateProductAction,
  publishProductAction,
  unpublishProductAction,
} from "lib/actions/products";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return buildMetadata({
    title: `Product ${id.slice(0, 8)}`,
    path: `/admin/products/${id}`,
    noIndex: true,
  });
}

// ── Inline product actions (server component) ─────────────────────

async function handleArchive(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await archiveProductAction(id);
}

async function handleRestore(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await restoreProductAction(id);
}

async function handleDelete(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await deleteProductAction(id);
}

async function handleDuplicate(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await duplicateProductAction(id);
}

async function handlePublish(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await publishProductAction(id);
}

async function handleUnpublish(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await unpublishProductAction(id);
}

// ── Page ──────────────────────────────────────────────────────────

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await props.params;
  const [product, categories, existingImages, existingVariants] = await Promise.all([
    getProductById(id),
    getCategories(),
    listAdminProductImages(id),
    listAdminProductVariants(id),
  ]);
  if (!product) notFound();

  const isActive = product.status === "active";
  const selectedCategoryIds = product.categories.map((c) => c.id);

  return (
    <>
      <AdminTopBar
        title={product.name}
        description={`₦${product.price.toFixed(2)}${
          product.discount_price
            ? ` · was ₦${product.discount_price.toFixed(2)}`
            : ""
        } · ${product.preparation_minutes}m prep`}
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
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-3">
          {/* Main form */}
          <div className="flex flex-col gap-[var(--ds-space-4)] lg:col-span-2">
            <Card variant="dashboard">
              <Label tone="muted">Product details</Label>
              <div className="mt-[var(--ds-space-4)]">
                <ProductForm
                  categories={categories}
                  mode="edit"
                  product={product}
                  selectedCategoryIds={selectedCategoryIds}
                  existingImages={existingImages}
                />
              </div>
            </Card>

            <VariantsEditor
              productId={id}
              initialVariants={existingVariants}
            />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-[var(--ds-space-4)]">
            {/* Categories card */}
            {product.categories.length > 0 && (
              <Card variant="dashboard">
                <Label tone="muted">Categories</Label>
                <div className="mt-[var(--ds-space-3)] flex flex-wrap gap-[var(--ds-space-1)]">
                  {product.categories.map((c) => (
                    <span
                      key={c.id}
                      className="rounded-full bg-[var(--ds-color-accent)]/10 px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-accent)]"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Status card */}
            <Card variant="dashboard">
              <Label tone="muted">Status</Label>
              <dl className="mt-[var(--ds-space-3)] grid grid-cols-2 gap-[var(--ds-space-2)] text-[length:var(--ds-text-body)]">
                <dt className="text-[var(--ds-color-muted)]">Visibility</dt>
                <dd className="text-right text-[var(--ds-color-fg)]">
                  {product.status}
                </dd>
                <dt className="text-[var(--ds-color-muted)]">Available</dt>
                <dd className="text-right text-[var(--ds-color-fg)]">
                  {product.is_available ? "Yes" : "No"}
                </dd>
                <dt className="text-[var(--ds-color-muted)]">Featured</dt>
                <dd className="text-right text-[var(--ds-color-fg)]">
                  {product.is_featured ? "Yes" : "No"}
                </dd>
                <dt className="text-[var(--ds-color-muted)]">Archived</dt>
                <dd className="text-right text-[var(--ds-color-fg)]">
                  {product.is_archived ? "Yes" : "No"}
                </dd>
              </dl>
            </Card>

            {/* Actions card */}
            <Card variant="dashboard">
              <Label tone="muted">Actions</Label>
              <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
                <form action={isActive ? handleUnpublish : handlePublish}>
                  <input type="hidden" name="id" value={product.id} />
                  <Button
                    type="submit"
                    variant={isActive ? "outline" : "primary"}
                    className="w-full"
                  >
                    {isActive ? "Unpublish" : "Publish"}
                  </Button>
                </form>

                <form action={handleDuplicate}>
                  <input type="hidden" name="id" value={product.id} />
                  <Button type="submit" variant="ghost" className="w-full">
                    Duplicate
                  </Button>
                </form>

                {product.is_archived ? (
                  <form action={handleRestore}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="ghost" className="w-full">
                      Restore
                    </Button>
                  </form>
                ) : (
                  <form action={handleArchive}>
                    <input type="hidden" name="id" value={product.id} />
                    <Button type="submit" variant="ghost" className="w-full">
                      Archive
                    </Button>
                  </form>
                )}

                <form action={handleDelete}>
                  <input type="hidden" name="id" value={product.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    className="w-full text-[var(--ds-color-danger)]"
                  >
                    Delete
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </AdminPageContainer>
    </>
  );
}
