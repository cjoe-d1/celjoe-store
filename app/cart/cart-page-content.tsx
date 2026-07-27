"use client";

import { useCart } from "components/cart/cart-context";
import {
  CartItem,
  OrderSummary,
  PromoCode,
  EmptyState,
  Button,
  Container,
  SectionTitle,
  Label,
  Stack,
} from "components/chds";
import Link from "next/link";
import { useState } from "react";

export default function CartPageContent() {
  const { cart, updateCartItem } = useCart();
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const items = (cart?.items ?? []).map((item) => ({
    id: item.id || item.variant?.id || "",
    href: `/product/${item.product.slug}`,
    title: item.product.name,
    subtitle: item.variant?.name !== "Default Title" ? item.variant?.name : undefined,
    imageUrl: item.product.imageUrl,
    imageAlt: item.product.imageAltText || item.product.name,
    quantity: item.quantity,
    lineTotal: item.totalPrice,
    rawLine: item,
  }));

  const summary = {
    subtotal: cart?.cost?.subtotal ?? { amount: "0.00", currencyCode: "NGN" },
    tax: cart?.cost?.tax ?? { amount: "0.00", currencyCode: "NGN" },
    total: cart?.cost?.total ?? { amount: "0.00", currencyCode: "NGN" },
  };

  const handleApplyPromo = () => {
    if (!promo.trim()) {
      setPromoMessage("Enter a promo code to apply.");
      return;
    }
    setPromoMessage("Promo codes land soon — your code is saved for later.");
  };

  if (items.length === 0) {
    return (
      <Container className="py-[var(--ds-space-16)]">
        <EmptyState
          title="Your cart is empty."
          description="When you're ready, add something thoughtfully made."
        />
        <div className="mt-[var(--ds-space-6)] flex flex-wrap justify-center gap-[var(--ds-space-3)]">
          <Button asChild>
            <Link href="/kitchen">Browse the kitchen</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/bbq">The Smokehouse</Link>
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-[var(--ds-space-12)]">
      <SectionTitle>My Cart</SectionTitle>
      <div className="mt-[var(--ds-space-6)] grid grid-cols-1 gap-[var(--ds-space-10)] lg:grid-cols-[1fr_360px]">
        <Stack gap="4">
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onDecrease={() => {
                const variantId = (item as any).rawLine.variant?.id ?? "";
                const newQuantity = item.quantity - 1;
                updateCartItem(variantId, newQuantity === 0 ? "delete" : "minus");
              }}
              onIncrease={() => {
                const variantId = (item as any).rawLine.variant?.id ?? "";
                updateCartItem(variantId, "plus");
              }}
              onRemove={() => {
                const variantId = (item as any).rawLine.variant?.id ?? "";
                updateCartItem(variantId, "delete");
              }}
            />
          ))}
        </Stack>
        <aside className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]">
          <Label tone="muted">Order Summary</Label>
          <div className="mt-[var(--ds-space-4)]">
            <OrderSummary summary={summary} />
          </div>
          <div className="mt-[var(--ds-space-5)]">
            <Label tone="muted">Promo code</Label>
            <div className="mt-[var(--ds-space-2)]">
              <PromoCode
                value={promo}
                onChange={setPromo}
                onApply={handleApplyPromo}
              />
              {promoMessage ? (
                <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {promoMessage}
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-[var(--ds-space-6)] flex flex-col gap-[var(--ds-space-2)]">
            <Button asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/kitchen">Continue browsing</Link>
            </Button>
          </div>
        </aside>
      </div>
    </Container>
  );
}
