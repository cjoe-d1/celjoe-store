"use client";

import { VariantSelector } from "components/chds";
import { AddToCart } from "components/cart/add-to-cart";
import { PriceDisplay, AvailabilityBadge, PreparationTime } from "components/chds/product";
import { Product } from "lib/supabase/products";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function ProductInteractive({ product }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = product.optionGroups.reduce((acc, group) => {
    acc[group.name.toLowerCase()] = searchParams.get(group.name.toLowerCase()) ?? undefined;
    return acc;
  }, {} as Record<string, string | undefined>);

  const handleChange = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // ── Find the selected variant from current search params ──
  const selectedVariant = useMemo(
    () =>
      product.variants.find((v) =>
        v.optionValues.every(
          (option) => option.value === searchParams.get(option.name.toLowerCase()),
        ),
      ) ?? product.variants[0],
    [product.variants, searchParams],
  );

  // For variant products, use selected variant data.
  // For simple products, use product-level data.
  const effectivePrice = product.hasVariants
    ? selectedVariant?.price ?? product.price
    : product.price;

  const effectiveAvailable = product.hasVariants
    ? selectedVariant?.isAvailable ?? product.isAvailable
    : product.isAvailable;

  const effectiveStock = selectedVariant?.stockQuantity ?? product.stockQuantity;

  return (
    <div className="space-y-[var(--ds-space-4)]">
      {/* ── Variant-aware price ── */}
      <PriceDisplay
        amount={effectivePrice.amount}
        currencyCode={effectivePrice.currencyCode}
        className="w-fit text-[length:var(--ds-text-xl)]"
      />

      {/* ── Variant selector (only for variant products) ── */}
      {product.hasVariants && product.optionGroups.length > 0 && (
        <VariantSelector
          optionGroups={product.optionGroups}
          variants={product.variants}
          value={value}
          onChange={handleChange}
          className="mb-8"
        />
      )}

      {/* ── Availability & stock ── */}
      <div className="flex flex-wrap items-center gap-[var(--ds-space-3)]">
        <AvailabilityBadge available={effectiveAvailable} />
        {product.hasVariants && selectedVariant && (
          <span
            className="text-[length:var(--ds-text-caption)]"
            style={{ color: effectiveStock > 0 ? "var(--ds-color-success)" : "var(--ds-color-danger)" }}
          >
            {effectiveStock > 0 ? `${effectiveStock} in stock` : "Out of stock"}
          </span>
        )}
      </div>

      {/* ── Prep time ── */}
      {product.preparationTimeMinutes != null && (
        <PreparationTime minutes={product.preparationTimeMinutes} />
      )}

      {/* ── Add to cart ── */}
      <AddToCart product={product} />
    </div>
  );
}
