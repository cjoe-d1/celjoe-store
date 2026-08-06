"use client";

import { useState, useTransition, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  TextInput,
  Textarea,
  Button,
  Checkbox,
} from "components/chds";
import { ImageUploader } from "components/admin/image-uploader";
import type { ImageUploaderHandle } from "components/admin/image-uploader";
import {
  createProductAction,
  updateProductAction,
} from "lib/actions/products";
import type {
  ProductRow,
  CategoryRow,
} from "lib/supabase/admin/products";
import type { ProductImage } from "lib/supabase/admin/product-images";

// ── Props ─────────────────────────────────────────────────────────

type Mode = "create" | "edit";

type Props = {
  categories: CategoryRow[];
  mode: Mode;
  product?: ProductRow;
  /** IDs of categories currently assigned to the product (edit mode). */
  selectedCategoryIds?: string[];
  /** Pre-loaded images (edit mode). */
  existingImages?: ProductImage[];
};

const SAVE_TIMEOUT_MS = 25_000;

// ── Helpers ───────────────────────────────────────────────────────

type CategoryNode = CategoryRow & { children: CategoryNode[] };

function buildTree(categories: CategoryRow[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  for (const c of categories) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of categories) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ── Component ─────────────────────────────────────────────────────

export function ProductForm({
  categories,
  mode,
  product,
  selectedCategoryIds = [],
  existingImages = [],
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const imageUploaderRef = useRef<ImageUploaderHandle>(null);

  // Category selection state
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(selectedCategoryIds)
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Product type toggle
  const [isVariantProduct, setIsVariantProduct] = useState<boolean>(
    product?.has_variants ?? false
  );

  const tree = useMemo(() => buildTree(categories), [categories]);

  const toggleCategory = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (formData: FormData) => {
    if (savingRef.current) return;
    setError(null);
    savingRef.current = true;

    // Append selected category IDs as hidden fields
    for (const cid of checked) {
      formData.append("category_ids", cid);
    }

    const timeout = setTimeout(() => {
      setError(
        "Save is taking longer than expected. Check your connection and try again."
      );
      savingRef.current = false;
    }, SAVE_TIMEOUT_MS);

    startTransition(async () => {
      try {
        let result;
        if (mode === "create") {
          result = await createProductAction(formData);
        } else if (product) {
          result = await updateProductAction(product.id, formData);
        } else {
          setError("Missing product.");
          return;
        }

        clearTimeout(timeout);

        if (!result?.ok) {
          setError(result?.error ?? "Save failed.");
          savingRef.current = false;
          return;
        }

        // Upload pending images (create mode only)
        if (mode === "create" && result.id && imageUploaderRef.current) {
          const uploadResult = await imageUploaderRef.current.uploadPending(result.id);
          if (!uploadResult.ok) {
            setError(`Product created but images failed: ${uploadResult.error}`);
            savingRef.current = false;
            return;
          }
        }

        if (mode === "create" && result.id) {
          router.push(`/admin/products/${result.id}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        clearTimeout(timeout);
        setError(
          e instanceof Error ? e.message : "An unexpected error occurred."
        );
        savingRef.current = false;
      }
    });
  };

  // ── Render ──────────────────────────────────────────────────────

  const renderNode = (node: CategoryNode, depth: number) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isChecked = checked.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-[var(--ds-space-2)] py-[var(--ds-space-1)]"
          style={{ paddingLeft: `calc(var(--ds-space-4) * ${depth})` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="flex size-5 items-center justify-center rounded text-[var(--ds-color-muted)] hover:bg-[var(--ds-color-surface-muted)]"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <label className="flex cursor-pointer items-center gap-[var(--ds-space-2)] select-none">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggleCategory(node.id)}
              className="size-[18px] cursor-pointer accent-[var(--ds-color-accent)]"
            />
            <span className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              {node.name}
            </span>
          </label>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-[var(--ds-space-5)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-[var(--ds-space-4)] md:grid-cols-2">
        <Field label="Product name">
          <TextInput
            name="name"
            defaultValue={product?.name ?? ""}
            placeholder="Smokehouse brisket plate"
            required
          />
        </Field>
        <Field label="Slug">
          <TextInput
            name="slug"
            defaultValue={product?.slug ?? ""}
            placeholder="Auto-generated from name"
          />
        </Field>

        {/* Hierarchical multi-category selector */}
        <Field label="Categories">
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-3)] max-h-[320px] overflow-y-auto">
            {tree.length === 0 ? (
              <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                No categories available.
              </p>
            ) : (
              tree.map((node) => renderNode(node, 0))
            )}
          </div>
          {checked.size > 0 && (
            <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              {checked.size} categor{checked.size === 1 ? "y" : "ies"} selected
            </p>
          )}
        </Field>

        <Field label="Preparation time (minutes)">
          <TextInput
            name="preparation_minutes"
            type="number"
            min="0"
            defaultValue={product?.preparation_minutes ?? 0}
          />
        </Field>

        {/* ── Pricing section ── */}
        <div className="col-span-full">
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-4)]">
            <p className="mb-[var(--ds-space-3)] font-medium text-[var(--ds-color-fg)]">Pricing</p>

            <div className="flex gap-[var(--ds-space-6)] mb-[var(--ds-space-4)]">
              <label className="flex cursor-pointer items-center gap-[var(--ds-space-2)] select-none">
                <input
                  type="radio"
                  name="product_type"
                  checked={!isVariantProduct}
                  onChange={() => setIsVariantProduct(false)}
                  className="size-[18px] cursor-pointer accent-[var(--ds-color-accent)]"
                />
                <span className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  Simple Product
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-[var(--ds-space-2)] select-none">
                <input
                  type="radio"
                  name="product_type"
                  checked={isVariantProduct}
                  onChange={() => setIsVariantProduct(true)}
                  className="size-[18px] cursor-pointer accent-[var(--ds-color-accent)]"
                />
                <span className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  Product with Variants
                </span>
              </label>
            </div>

            {/* Hidden input to send has_variants to server */}
            <input type="hidden" name="has_variants" value={isVariantProduct ? "on" : ""} />

            {isVariantProduct ? (
              <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Each variant owns its price, stock, and availability. Configure variants after saving.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-[var(--ds-space-4)] md:grid-cols-2">
                <Field label="Price (₦)">
                  <TextInput
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product?.price ?? ""}
                    placeholder="0.00"
                    required={!isVariantProduct}
                  />
                </Field>
                <Field label="Discount price (₦)">
                  <TextInput
                    name="discount_price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product?.discount_price ?? ""}
                    placeholder="0.00"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <Field label="Short description">
        <TextInput
          name="short_description"
          defaultValue={product?.short_description ?? ""}
          placeholder="One-line summary shown in cards"
        />
      </Field>

      <Field label="Description">
        <Textarea
          name="description"
          defaultValue={product?.description ?? ""}
          placeholder="Detailed story, ingredients, allergens"
          rows={6}
        />
      </Field>

      <Field label="Tags (comma-separated)">
        <TextInput
          name="tags"
          defaultValue={product?.tags?.join(", ") ?? ""}
          placeholder="spicy, signature, brisket"
        />
      </Field>

      {/* Images */}
      <Field label="Images">
        <ImageUploader
          ref={imageUploaderRef}
          productId={mode === "edit" ? product?.id : undefined}
          existingImages={existingImages}
        />
      </Field>

      <div className="flex flex-wrap gap-[var(--ds-space-4)]">
        <Checkbox
          name="is_available"
          defaultChecked={product?.is_available ?? true}
          label="Available for ordering"
        />
        <Checkbox
          name="is_featured"
          defaultChecked={product?.is_featured ?? false}
          label="Featured"
        />
      </div>

      <div className="flex justify-end gap-[var(--ds-space-3)]">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
