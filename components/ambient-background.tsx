"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * AmbientBackground — premium luxury ambient experience.
 *
 * Multi-layered, GPU-accelerated background animation:
 *   Layer 1: Pulsing gradient wash (barely perceptible warmth)
 *   Layer 2: 3 large slow-moving blurred orbs
 *   Layer 3: Noise texture overlay (grain)
 *   Layer 4: Mouse-reactive glow trail
 *
 * Inspired by Stripe, Linear, Apple — editorial restraint.
 *
 * - 60fps GPU-accelerated (CSS transforms + filter only)
 * - Respects prefers-reduced-motion
 * - Renders only on customer-facing pages (never admin)
 */

// --------------------------------------------------------------------------
// Orb definitions
// --------------------------------------------------------------------------

type OrbDef = {
  id: number;
  /** % viewport position */
  x: number;
  y: number;
  /** Blur radius */
  blur: number;
  /** CSS colour value */
  colour: string;
  /** Animation duration in seconds */
  duration: number;
};

const ORBS: OrbDef[] = [
  {
    id: 1,
    x: 15,
    y: 30,
    blur: 100,
    colour: "oklch(0.62 0.10 130 / 0.12)", // soft leaf-green
    duration: 32,
  },
  {
    id: 2,
    x: 65,
    y: 55,
    blur: 90,
    colour: "oklch(0.55 0.12 55 / 0.10)", // warm ember
    duration: 36,
  },
  {
    id: 3,
    x: 40,
    y: 70,
    blur: 85,
    colour: "oklch(0.50 0.06 75 / 0.09)", // subtle gold
    duration: 30,
  },
  {
    id: 4,
    x: 80,
    y: 20,
    blur: 110,
    colour: "oklch(0.60 0.08 145 / 0.08)", // deep-green accent
    duration: 40,
  },
];

export function AmbientBackground() {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
  const glowRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);

  // Skip on admin routes — dashboards need clean focus
  const isAdminPage = pathname?.startsWith("/admin");

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Mouse-reactive glow + gradient parallax
  useEffect(() => {
    if (reducedMotion || isAdminPage) return;

    let rafId: number;
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setCursorPos({ x, y });
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  if (reducedMotion || isAdminPage) return null;

  const glowX = 50 + (cursorPos.x - 0.5) * 8;
  const glowY = 50 + (cursorPos.y - 0.5) * 8;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Layer 1 — Pulsing ambient gradient wash */}
      <div
        ref={gradientRef}
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 30%, oklch(0.62 0.08 135 / 0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 70%, oklch(0.55 0.10 50 / 0.05) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 20% 50%, oklch(0.58 0.06 80 / 0.04) 0%, transparent 60%)",
          animation: "pulse-gradient 10s ease-in-out infinite alternate",
          willChange: "opacity",
        }}
      />

      {/* Layer 2 — Floating blurred orbs */}
      {ORBS.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: "clamp(300px, 40vw, 600px)",
            height: "clamp(300px, 40vw, 600px)",
            background: `radial-gradient(circle at 50% 50%, ${orb.colour}, transparent 75%)`,
            filter: `blur(${orb.blur}px)`,
            willChange: "transform, opacity",
            animation: `orb-float-${orb.id} ${orb.duration}s ease-in-out infinite alternate`,
            transition: "transform 0.8s ease-out",
          }}
        />
      ))}

      {/* Layer 3 — Mouse-reactive glow trail */}
      <div
        ref={glowRef}
        className="absolute rounded-full opacity-40"
        style={{
          left: `${glowX}%`,
          top: `${glowY}%`,
          width: "clamp(200px, 25vw, 400px)",
          height: "clamp(200px, 25vw, 400px)",
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.65 0.10 140 / 0.12), transparent 70%)",
          transform: "translate(-50%, -50%)",
          transition: "left 1.2s ease-out, top 1.2s ease-out",
          filter: "blur(60px)",
          willChange: "left, top",
        }}
      />

      {/* Layer 4 — Premium noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
