"use client";

import { VariantSelector } from "components/chds";
import { AddToCart } from "components/cart/add-to-cart";
import {
  PriceDisplay,
  AvailabilityBadge,
  PreparationTime,
} from "components/chds/product";
import { Product } from "lib/supabase/products";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function ProductInteractive({ product }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const variantId = searchParams.get("variant") ?? undefined;

  const handleSelect = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selectedVariant = useMemo(
    () => product.variants.find((v) => v.id === variantId),
    [product.variants, variantId],
  );

  const hasMultipleVariants =
    product.hasVariants && product.variants.length > 1;

  // Variant products never fall back to product.price (which is intentionally 0).
  const effectivePrice = product.hasVariants
    ? selectedVariant?.price
    : product.price;

  const effectiveAvailable = product.hasVariants
    ? (selectedVariant?.isAvailable ?? false)
    : product.isAvailable;

  const effectiveStock =
    selectedVariant?.stockQuantity ?? product.stockQuantity;

  return (
    <div className="space-y-[var(--ds-space-4)]">
      {/* ── Variant-aware price ── */}
      {product.hasVariants && !selectedVariant ? (
        <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Select an option
        </div>
      ) : (
        <PriceDisplay
          amount={effectivePrice!.amount}
          currencyCode={effectivePrice!.currencyCode}
          className="w-fit text-[length:var(--ds-text-xl)]"
        />
      )}

      {/* ── Variant selector (flat, id-keyed, data-driven) ── */}
      {hasMultipleVariants && (
        <VariantSelector
          variants={product.variants}
          selectedId={selectedVariant?.id}
          onSelect={handleSelect}
          className="mb-8"
        />
      )}

      {/* ── Availability & stock (hidden until a variant is selected) ── */}
      {(!product.hasVariants || selectedVariant) && (
        <div className="flex flex-wrap items-center gap-[var(--ds-space-3)]">
          <AvailabilityBadge available={effectiveAvailable} />
          {product.hasVariants && selectedVariant && (
            <span
              className="text-[length:var(--ds-text-caption)]"
              style={{
                color:
                  effectiveStock > 0
                    ? "var(--ds-color-success)"
                    : "var(--ds-color-danger)",
              }}
            >
              {effectiveStock > 0
                ? `${effectiveStock} in stock`
                : "Out of stock"}
            </span>
          )}
        </div>
      )}

      {/* ── Prep time ── */}
      {product.preparationTimeMinutes != null && (
        <PreparationTime minutes={product.preparationTimeMinutes} />
      )}

      {/* ── Add to cart ── */}
      <AddToCart product={product} />
    </div>
  );
}
