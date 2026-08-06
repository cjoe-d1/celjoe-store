"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { animate } from "motion";
import { useCallback, useRef, useState } from "react";

type AddToBasketButtonProps = {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  /**
   * Called IMMEDIATELY on click — before any animation.
   * This is where the commerce mutation (add to cart) happens.
   */
  onActivate: () => void;
  /**
   * Called AFTER the press animation + loading delay completes.
   * This is where toast + fly animation trigger.
   */
  onComplete: () => void;
  className?: string;
};

export function AddToBasketButton({
  availableForSale,
  selectedVariantId,
  onActivate,
  onComplete,
  className,
}: AddToBasketButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);
  const pressingRef = useRef(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Guard against double-clicks and invalid state
      if (pressingRef.current || !selectedVariantId || !availableForSale) {
        e.preventDefault();
        return;
      }
      pressingRef.current = true;

      // --- 1. Commerce mutation (immediate, synchronous) ---
      // DO NOT call preventDefault — form submission must proceed
      onActivate();

      const el = btnRef.current;
      if (!el) return;

      (async () => {
        // --- 2. Press animation: 95% → 110% → 100% with spring haptic feel ---
        await animate(
          el,
          { scale: 0.95 },
          { type: "spring", stiffness: 600, damping: 20, mass: 0.5 },
        );
        await animate(
          el,
          { scale: 1.1 },
          { type: "spring", stiffness: 450, damping: 10, mass: 0.6 },
        );
        await animate(
          el,
          { scale: 1 },
          { type: "spring", stiffness: 500, damping: 18, mass: 0.55 },
        );

        // --- 3. Loading state (250–400 ms) ---
        setLoading(true);
        await new Promise((r) => setTimeout(r, 320));
        setLoading(false);

        pressingRef.current = false;

        // --- 4. Toast + fly animation (after loading) ---
        onComplete();
      })();
    },
    [availableForSale, selectedVariantId, onActivate, onComplete],
  );

  const disabled = !availableForSale || !selectedVariantId;

  return (
    <button
      ref={btnRef}
      type="submit"
      aria-label={
        loading
          ? "Adding to basket"
          : !availableForSale
            ? "Out of stock"
            : "Add to basket"
      }
      aria-busy={loading}
      disabled={disabled}
      onClick={handleClick}
      className={clsx(
        "relative flex w-full items-center justify-center rounded-full p-4 tracking-wide text-white transition-colors",
        disabled
          ? "cursor-not-allowed opacity-60"
          : loading
            ? "cursor-wait bg-blue-700"
            : "bg-blue-600 hover:bg-blue-700",
        className,
      )}
    >
      <span
        className={clsx(
          "absolute left-0 ml-4 transition-opacity",
          loading && "opacity-0",
        )}
        aria-hidden={loading}
      >
        <PlusIcon className="h-5" />
      </span>

      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Adding...
        </span>
      ) : !availableForSale ? (
        "Out Of Stock"
      ) : (
        "Add To Basket"
      )}
    </button>
  );
}
