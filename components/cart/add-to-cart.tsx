"use client";

import { addItem } from "components/cart/actions";
import { useAddToBasket } from "components/cart/add-to-basket-provider";
import { AddToBasketButton } from "components/cart/add-to-basket-button";
import { useCart } from "components/cart/cart-context";
import type { Product } from "lib/supabase/products";
import { useSearchParams } from "next/navigation";
import { useActionState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";

export function AddToCart({ product }: { product: Product }) {
  const { variants } = product;
  const { addCartItem } = useCart();
  const { triggerFly } = useAddToBasket();
  const searchParams = useSearchParams();
  const [message, formAction] = useActionState(addItem, null);

  // Variant products require an explicit selection; never default to variants[0].
  // Simple products have exactly one system "Default" variant.
  const selectedVariantId = product.hasVariants
    ? (searchParams.get("variant") ?? undefined)
    : variants[0]?.id;

  const finalVariant = variants.find((v) => v.id === selectedVariantId);
  const addItemAction = formAction.bind(null, selectedVariantId);
  const availableForSale = product.hasVariants
    ? (finalVariant?.isAvailable ?? false)
    : product.isAvailable;

  const productImage = product.images?.[0]?.url ?? null;

  // --- Phase 1: Commerce mutation (runs IMMEDIATELY on click, before animation) ---
  const handleCommerceMutation = useCallback(() => {
    if (!finalVariant) return;

    // Optimistic cart update — this is the single source of truth for cart state
    addCartItem(finalVariant, product);
  }, [addCartItem, finalVariant, product]);

  // --- Phase 2: UI effects (runs AFTER loading delay) ---
  const handleAnimationComplete = useCallback(() => {
    if (!finalVariant) return;

    // Toast — appears after loading completes
    toast(
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : null}
          <div className="flex flex-col">
            <span className="text-sm font-medium">Added to Basket</span>
            <span className="text-xs text-[var(--ds-color-muted)]">
              {product.name}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="rounded-full border border-[var(--ds-color-border)] px-3 py-1 text-xs transition-colors hover:bg-[var(--ds-color-surface-muted)]"
            onClick={(e) => e.stopPropagation()}
          >
            Continue Shopping
          </Link>
          <Link
            href="/cart"
            className="rounded-full bg-[var(--ds-color-accent)] px-3 py-1 text-xs text-white transition-colors hover:opacity-90"
            onClick={(e) => e.stopPropagation()}
          >
            View Basket
          </Link>
        </div>
      </div>,
      { duration: 2500 },
    );

    // Fly-to-cart animation — from product image to cart icon
    const sourceEl = document.getElementById("celjoe-product-image");
    const sourceRect = sourceEl?.getBoundingClientRect() ?? null;

    if (sourceRect && productImage) {
      triggerFly({
        imageSrc: productImage,
        imageAlt: product.name,
        sourceRect,
      });
    }
  }, [finalVariant, product, triggerFly, productImage]);

  return (
    <form action={addItemAction}>
      <AddToBasketButton
        availableForSale={availableForSale}
        selectedVariantId={selectedVariantId}
        onActivate={handleCommerceMutation}
        onComplete={handleAnimationComplete}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {message}
      </p>
    </form>
  );
}
