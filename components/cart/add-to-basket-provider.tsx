"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { animate } from "motion";

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type FlyRequest = {
  /** Product image URL */
  imageSrc: string;
  /** Product name (alt text) */
  imageAlt: string;
  /** Source element bounding rect (where the image starts from) */
  sourceRect: DOMRect;
};

type AddToBasketContextValue = {
  /** Register the cart icon DOM element so the fly knows where to land */
  registerCartRef: (el: HTMLElement | null) => void;
  /** Trigger the fly-to-cart animation sequence */
  triggerFly: (req: FlyRequest) => void;
  /** Incremented each time a fly lands — drives cart icon bounce + ripple */
  landKey: number;
  /** Incremented each time a fly lands — drives cart drawer peek */
  peekKey: number;
};

const Ctx = createContext<AddToBasketContextValue | null>(null);

export function useAddToBasket() {
  const c = useContext(Ctx);
  if (!c) throw new Error("Missing <AddToBasketProvider>");
  return c;
}

// --------------------------------------------------------------------------
// Provider
// --------------------------------------------------------------------------

export function AddToBasketProvider({ children }: { children: ReactNode }) {
  const cartRef = useRef<HTMLElement | null>(null);
  const [fly, setFly] = useState<FlyRequest | null>(null);
  const [landKey, setLandKey] = useState(0);
  const [peekKey, setPeekKey] = useState(0);

  const registerCartRef = useCallback((el: HTMLElement | null) => {
    cartRef.current = el;
  }, []);

  const triggerFly = useCallback((req: FlyRequest) => {
    setFly(req);
  }, []);

  const onFlyDone = useCallback(() => {
    setFly(null);
    setLandKey((k) => k + 1);
    setPeekKey((k) => k + 1);
  }, []);

  return (
    <Ctx.Provider value={{ registerCartRef, triggerFly, landKey, peekKey }}>
      {children}
      {fly && (
        <FlyOverlay fly={fly} cartRef={cartRef} onDone={onFlyDone} />
      )}
    </Ctx.Provider>
  );
}

// --------------------------------------------------------------------------
// FlyOverlay — portal-mounted, 3-stage curved-arc animation
// --------------------------------------------------------------------------

const FLY_TIMING = {
  /** ms — brief pause so the button press animation is visible first */
  DELAY: 80,
  /** ms — upward arc phase */
  ARC_UP: 220,
  /** ms — descent into cart */
  ARC_DOWN: 200,
};

function FlyOverlay({
  fly,
  cartRef,
  onDone,
}: {
  fly: FlyRequest;
  cartRef: React.RefObject<HTMLElement | null>;
  onDone: () => void;
}) {
  const cloneRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useLayoutEffect(() => {
    if (doneRef.current) return;
    const cart = cartRef.current;
    if (!cart) {
      onDone();
      return;
    }

    const from = fly.sourceRect;
    const to = cart.getBoundingClientRect();

    // Compute target translation deltas from source centre to cart centre
    const toX = to.left + to.width / 2 - (from.left + from.width / 2);
    const toY = to.top + to.height / 2 - (from.top + from.height / 2);

    // Target scale so the clone fits inside the cart icon
    const targetScale = Math.min(
      (to.width * 0.5) / from.width,
      (to.height * 0.5) / from.height,
      0.14,
    );

    const el = cloneRef.current;
    if (!el) return;

    let cancelled = false;

    (async () => {
      // Stage 0 — brief pause so button animation is visible
      await new Promise((r) => setTimeout(r, FLY_TIMING.DELAY));
      if (cancelled) return;

      // Stage 1 — launch upward in an arc (GPU-accelerated transforms only)
      await animate(
        el,
        {
          x: toX * 0.45,
          y: toY * 0.28 - from.height * 0.48,
          scale: 0.58,
          rotate: -8,
          opacity: 0.95,
        },
        { duration: FLY_TIMING.ARC_UP / 1000, ease: "easeOut" },
      );
      if (cancelled) return;

      // Stage 2 — descend into cart, shrink, fade
      await animate(
        el,
        {
          x: toX,
          y: toY,
          scale: targetScale,
          rotate: 5,
          opacity: 0,
        },
        { duration: FLY_TIMING.ARC_DOWN / 1000, ease: [0.32, 0.72, 0, 1] },
      );

      if (!cancelled) {
        doneRef.current = true;
        onDone();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fly, cartRef, onDone]);

  const { sourceRect } = fly;

  return createPortal(
    <div
      ref={cloneRef}
      aria-hidden
      style={{
        position: "fixed",
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        zIndex: 200,
        pointerEvents: "none",
        willChange: "transform, opacity",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fly.imageSrc}
        alt={fly.imageAlt}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>,
    document.body,
  );
}
