import { images } from "./images";

export const bbqContent = {
  hero: {
    eyebrow: "The Smokehouse",
    title: "Fire. Time. Craft.",
    description:
      "The Smokehouse is Celjoe's signature experience — slow, deliberate, built around live fire and patience. Weekend platters, char-kissed proteins, and sides worth the detour.",
    image: images.bbq.hero,
    primaryCta: { label: "View the menu", href: "#smokehouse-menu" },
    secondaryCta: { label: "Book the Smokehouse", href: "/catering" },
  },

  philosophy: {
    label: "The Philosophy",
    title: "Built on patience",
    body: "We don't rush fire. Every cut rests in our rub for hours before it ever meets the grill. The result is honest smoke, rendered fat, and a bark that tells you exactly what you're eating.",
  },

  craft: {
    eyebrow: "The Craft",
    title: "Smoke, low and slow",
    body: "Oura is offset-fired hardwood. We cook by feel, not by timer. The crust forms; the inside stays tender. It's the kind of cooking that asks for your attention — and earns it.",
    image: images.bbq.chefAtGrill,
  },

  featuredPlatters: {
    label: "The Platter",
    title: "Featured platters",
    caption: "Weekend specials, rotating sides, and pairings picked by the chef.",
  },

  pairings: {
    eyebrow: "Pairings",
    title: "What to drink alongside",
    body: "A smoky platter wants something cool and confident. Our pairings editor has done the work — soft citrus, cold sparkling water, and a few house-made options to round the meal.",
    image: images.bbq.pairings,
  },

  cta: {
    label: "The Smokehouse CTA",
    title: "Reserve the weekend",
    description: "Weekend platters are prepared in limited batches. Reserve early, or book the full Smokehouse experience for an event.",
    backgroundImage: images.bbq.ctaBg,
    primaryCta: { label: "Plan an event", href: "/catering" },
    secondaryCta: { label: "Back to the kitchen", href: "/kitchen" },
  },
} as const;
