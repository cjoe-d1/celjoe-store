"use client";

import { useCart } from "components/cart/cart-context";
import { CartDrawer, CartItem } from "components/chds";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { removeItem, updateItemQuantity } from "./actions";

export default function ChdsCartDrawer() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  const totalQuantity = cart?.totalQuantity || 0;
  const subtotalAmount = cart?.cost?.subtotal?.amount || "0";
  const currencyCode = cart?.cost?.subtotal?.currencyCode || "USD";

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  const items = (cart?.items || []).map((item) => ({
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
    subtotal: cart?.cost?.subtotal || { amount: "0", currencyCode: "USD" },
    tax: cart?.cost?.tax || { amount: "0", currencyCode: "USD" },
    total: cart?.cost?.total || { amount: "0", currencyCode: "USD" },
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Open cart (${totalQuantity} item${totalQuantity === 1 ? "" : "s"})`}
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
      >
        <ShoppingBagIcon className="h-5 w-5" />
        {totalQuantity > 0 ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ds-color-accent)] px-1 text-[10px] font-[var(--ds-font-weight-medium)] leading-none text-white"
          >
            {totalQuantity}
          </span>
        ) : null}
      </button>
      <CartDrawer
        open={isOpen}
        onClose={handleClose}
        items={items}
        summary={summary}
        onCheckout={handleCheckout}
        renderItem={(item) => (
          <CartItem
            item={item}
            onDecrease={() => {
              const newQuantity = item.quantity - 1;
              if (newQuantity === 0) {
                updateCartItem((item as any).rawLine.variant?.id || "", "delete");
                removeItem(null, (item as any).rawLine.variant?.id || "");
              } else {
                updateCartItem((item as any).rawLine.variant?.id || "", "minus");
                updateItemQuantity(null, { variantId: (item as any).rawLine.variant?.id || "", quantity: newQuantity });
              }
            }}
            onIncrease={() => {
              const newQuantity = item.quantity + 1;
              updateCartItem((item as any).rawLine.variant?.id || "", "plus");
              updateItemQuantity(null, { variantId: (item as any).rawLine.variant?.id || "", quantity: newQuantity });
            }}
            onRemove={() => {
              updateCartItem((item as any).rawLine.variant?.id || "", "delete");
              removeItem(null, (item as any).rawLine.variant?.id || "");
            }}
          />
        )}
      />
    </>
  );
}