"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Label, Button, TextInput } from "components/chds";
import {
  createVariantAction,
  updateVariantAction,
  deleteVariantAction,
} from "lib/actions/product-variants";
import type { ProductVariant } from "lib/supabase/admin/variants";

// ── Props ─────────────────────────────────────────────────────────

type Props = {
  productId: string;
  initialVariants: ProductVariant[];
};

// ── Component ─────────────────────────────────────────────────────

export function VariantsEditor({ productId, initialVariants }: Props) {
  const router = useRouter();
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ── Handlers ─────────────────────────────────────────────────

  const handleSave = (formData: FormData) => {
    setError(null);
    formData.set("product_id", productId);

    startTransition(async () => {
      const isNew = formData.get("id") === "new";
      const action = isNew ? createVariantAction : updateVariantAction;
      const result = await action(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Refresh router to get updated data
      router.refresh();
      setEditingId(null);
      setIsAdding(false);

      // Optimistic local update
      if (isNew && result.id) {
        const stockQuantity = Number(formData.get("stock_quantity") ?? 0);
        const isAvailable =
          formData.get("is_available") === "on" && stockQuantity > 0;
        const newVariant: ProductVariant = {
          id: result.id,
          productId,
          name: String(formData.get("name") ?? "Variant").trim(),
          price: Number(formData.get("price") ?? 0),
          stockQuantity,
          isAvailable,
          position: variants.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setVariants((prev) => [...prev, newVariant]);
      }
    });
  };

  const handleDelete = (variantId: string) => {
    setError(null);
    const formData = new FormData();
    formData.set("id", variantId);
    formData.set("product_id", productId);

    startTransition(async () => {
      const result = await deleteVariantAction(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      router.refresh();
    });
  };

  // ── Render: single variant row ───────────────────────────────

  const renderRow = (variant: ProductVariant, isEditing: boolean) => {
    const isNew = variant.id.startsWith("new-");
    const stockZero = variant.stockQuantity === 0;

    if (isEditing) {
      return (
        <form
          key={variant.id}
          action={handleSave}
          className="grid grid-cols-[1fr_100px_80px_80px_auto] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-accent)]/30 bg-[var(--ds-color-accent)]/5 p-[var(--ds-space-3)]"
        >
          <input type="hidden" name="id" value={isNew ? "new" : variant.id} />
          <TextInput
            name="name"
            defaultValue={variant.name}
            placeholder="Size / Option"
            className="min-w-0"
          />
          <TextInput
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={variant.price}
            placeholder="0.00"
          />
          <TextInput
            name="stock_quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={variant.stockQuantity}
            placeholder="0"
          />
          <label className="flex cursor-pointer items-center gap-[var(--ds-space-1)] select-none text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
            <input
              type="checkbox"
              name="is_available"
              defaultChecked={variant.isAvailable}
              className="size-4 accent-[var(--ds-color-accent)]"
            />
            Available
          </label>
          <div className="flex gap-[var(--ds-space-1)]">
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? "…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setIsAdding(false);
                if (isNew) setVariants((prev) => prev.filter((v) => v.id !== variant.id));
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      );
    }

    // Read-only row
    return (
      <div
        key={variant.id}
        className="grid grid-cols-[1fr_100px_80px_80px_auto] items-center gap-[var(--ds-space-2)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-3)]"
      >
        <span className="truncate text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          {variant.name}
        </span>
        <span className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
          ₦{variant.price.toFixed(2)}
        </span>
        <span
          className={`text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] ${
            stockZero ? "text-[var(--ds-color-danger)]" : "text-[var(--ds-color-fg)]"
          }`}
        >
          {variant.stockQuantity}
        </span>
        <span
          className={`text-[length:var(--ds-text-caption)] ${
            variant.isAvailable
              ? "text-[var(--ds-color-success)]"
              : "text-[var(--ds-color-muted)]"
          }`}
        >
          {variant.isAvailable ? "Available" : "Unavailable"}
        </span>
        <div className="flex gap-[var(--ds-space-1)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditingId(variant.id)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(variant.id)}
            disabled={pending}
            className="text-[var(--ds-color-danger)]"
          >
            Del
          </Button>
        </div>
      </div>
    );
  };

  // ── Render: component ────────────────────────────────────────

  return (
    <Card variant="dashboard">
      <div className="flex items-center justify-between">
        <Label tone="muted">Variants</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const newId = `new-${Date.now()}`;
            setVariants((prev) => [
              ...prev,
              {
                id: newId,
                productId,
                name: "",
                price: 0,
                stockQuantity: 0,
                isAvailable: false,
                position: prev.length,
                createdAt: "",
                updatedAt: "",
              },
            ]);
            setEditingId(newId);
            setIsAdding(true);
          }}
          disabled={isAdding}
        >
          + Add variant
        </Button>
      </div>

      {error && (
        <div className="mt-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      )}

      <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_80px_80px_auto] items-center gap-[var(--ds-space-2)] px-[var(--ds-space-3)]">
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            Name
          </span>
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            Price
          </span>
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            Stock
          </span>
          <span className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            Status
          </span>
          <span />
        </div>

        {variants.length === 0 && !isAdding ? (
          <p className="py-[var(--ds-space-4)] text-center text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            No variants yet. Products without variants default to a single item.
          </p>
        ) : (
          variants.map((v) => renderRow(v, editingId === v.id))
        )}
      </div>
    </Card>
  );
}
