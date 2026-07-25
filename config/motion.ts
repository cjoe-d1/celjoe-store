export const motion = {
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  },
  reducedMotionMediaQuery: "(prefers-reduced-motion: reduce)",
} as const;

