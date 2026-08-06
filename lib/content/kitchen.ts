import { images } from "./images";

export const kitchenContent = {
  hero: {
    eyebrow: "Editorial Dining",
    title: "The Kitchen",
    description:
      "Today's menu, chef's picks, and the meals our guests return for. Every plate is prepared in our kitchen and finished with care.",
  },

  quickFilters: [
    { label: "All", value: "all" },
    { label: "Lighter", value: "lighter" },
    { label: "Plates", value: "plates" },
    { label: "Bowls", value: "bowls" },
    { label: "Sides", value: "sides" },
    { label: "Drinks", value: "drinks" },
  ] as const,

  todayMenu: {
    title: "Today's Menu",
  },

  chefsPicks: {
    eyebrow: "Chef's Picks",
    title: "From the pass, with intent",
    body: "Each dish on the Chef's Picks is chosen by our head chef for its seasonality, sourcing, and balance. We keep the list short on purpose — so the kitchen can focus.",
    image: images.kitchen.chefPrep,
    cta: { label: "Browse the full menu", href: "/search" },
  },

  browseCategories: {
    title: "Browse by Category",
  },

  popularDishes: {
    title: "Popular dishes",
    caption: "What our guests return for, again and again.",
  },

  newArrivals: {
    title: "New on the menu",
    label: "Recently added",
  },
} as const;
