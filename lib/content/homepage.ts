import { images } from "./images";

export const homepageContent = {
  hero: {
    headline: "Celjoe Store",
    subheadline: "From our kitchen to your table — crafted with care, served with heart.",
    image: images.home.hero,
    primaryCta: { label: "Explore the Menu", href: "/search" },
    secondaryCta: { label: "Our Story", href: "/our-story" },
  },

  todaysKitchen: {
    title: "Today's Kitchen",
  },

  curatedCategories: {
    title: "Curated Categories",
  },

  chefsTable: {
    title: "Chef's Recommendation",
  },

  smokehouse: {
    title: "The Smokehouse",
    description: "Fire-kissed flavors for the bold.",
    image: images.home.smokehouse,
    cta: { label: "Explore", href: "/search/smokehouse" },
  },

  catering: {
    title: "Catering",
    description: "Elevate every gathering.",
    image: images.home.cateringPreview,
    cta: { label: "Book an Event", href: "/catering" },
  },

  standards: {
    title: "The CELJOE Grills & Juicebar Standard",
    items: [
      { title: "Hospitality First", description: "Every dish is prepared with intention and care." },
      { title: "Editorial Presentation", description: "Food deserves to be seen, not just eaten." },
      { title: "Premium Craftsmanship", description: "Sourced ingredients, honest technique." },
    ],
  },

  guestStories: {
    title: "Guest Stories",
  },

  finalInvitation: {
    headline: "Join us at the table",
    image: images.home.ctaBg,
    primaryCta: { label: "Reserve a Table", href: "/catering" },
  },
} as const;
