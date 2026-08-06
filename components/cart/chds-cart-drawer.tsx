"use client";

import { useCart } from "components/cart/cart-context";
import { CartDrawer, CartItem } from "components/chds";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useAddToBasket } from "components/cart/add-to-basket-provider";
import { animate } from "motion";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CURRENCY_CODE } from "lib/format-currency";

export default function ChdsCartDrawer() {
  const { cart, updateCartItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const { registerCartRef, landKey, peekKey } = useAddToBasket();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const [bounceTilt, setBounceTilt] = useState(false);

  // Register the cart button with the animation provider
  useEffect(() => {
    registerCartRef(btnRef.current);
    return () => registerCartRef(null);
  }, [registerCartRef]);

  // Cart icon bounce + tilt + ripple when fly animation lands
  useEffect(() => {
    if (landKey === 0) return;
    const el = btnRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      // Bounce — spring scale up
      await animate(
        el,
        { scale: 1.28 },
        { type: "spring", stiffness: 500, damping: 7, mass: 0.55 },
      );
      if (cancelled) return;

      // Tilt — quick wobble
      await animate(
        el,
        { rotate: [0, -14, 10, -6, 0] },
        { duration: 0.42, ease: "easeOut" },
      );
      if (cancelled) return;

      // Settle — spring back to normal
      await animate(
        el,
        { scale: 1 },
        { type: "spring", stiffness: 400, damping: 15, mass: 0.6 },
      );
    })();

    // Ripple on landing
    setRippleKey((k) => k + 1);

    return () => {
      cancelled = true;
    };
  }, [landKey]);

  // Cart drawer peek when fly animation completes
  useEffect(() => {
    if (peekKey === 0) return;
    setBounceTilt(true);
    const timeout = setTimeout(() => setBounceTilt(false), 420);
    return () => clearTimeout(timeout);
  }, [peekKey]);

  const totalQuantity = cart?.totalQuantity || 0;

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
    subtotal: cart?.cost?.subtotal ?? { amount: "0", currencyCode: CURRENCY_CODE },
    tax: cart?.cost?.tax ?? { amount: "0", currencyCode: CURRENCY_CODE },
    total: cart?.cost?.total ?? { amount: "0", currencyCode: CURRENCY_CODE },
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Open cart (${totalQuantity} item${totalQuantity === 1 ? "" : "s"})`}
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
      >
        <ShoppingBagIcon className="h-5 w-5" />

        {/* Cart drawer peek indicator — subtle horizontal nudge */}
        {bounceTilt ? (
          <motion.span
            aria-hidden
            initial={{ x: 0 }}
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <ShoppingBagIcon className="h-5 w-5" />
          </motion.span>
        ) : null}

        {totalQuantity > 0 ? (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--ds-color-accent)] px-1 text-[10px] font-[var(--ds-font-weight-medium)] leading-none text-white"
          >
            {totalQuantity}
          </span>
        ) : null}

        {/* Ripple ring on landing */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={rippleKey}
            aria-hidden
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-full border border-[var(--ds-color-accent)]"
          />
        </AnimatePresence>
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
              const variantId = (item as any).rawLine.variant?.id || "";
              const newQuantity = item.quantity - 1;
              updateCartItem(variantId, newQuantity === 0 ? "delete" : "minus");
            }}
            onIncrease={() => {
              const variantId = (item as any).rawLine.variant?.id || "";
              updateCartItem(variantId, "plus");
            }}
            onRemove={() => {
              const variantId = (item as any).rawLine.variant?.id || "";
              updateCartItem(variantId, "delete");
            }}
          />
        )}
      />
    </>
  );
}
