import { images } from "./images";

export const cateringContent = {
  hero: {
    eyebrow: "Catering",
    title: "Service, not just a kitchen",
    description:
      "Catering is hospitality at scale. We plan with you, cook on schedule, and run the room so your guests never have to think about it.",
    image: images.catering.hero,
    primaryCta: { label: "Request a quotation", href: "#enquire" },
    secondaryCta: { label: "View the menu", href: "/kitchen" },
  },

  eventCategories: [
    { title: "Weddings", description: "Rehearsal dinners, full receptions, late-night kitchen, morning-after brunches.", image: images.catering.wedding },
    { title: "Corporate", description: "Board meetings, conferences, product launches, hosted dinners, end-of-year parties.", image: images.catering.corporate },
    { title: "Birthdays", description: "Intimate suppers to larger gatherings — built around the guest of honour.", image: images.catering.birthday },
    { title: "Outdoor", description: "Garden parties, picnics, and lawn dinners. We bring the kitchen with us.", image: images.catering.outdoor },
    { title: "Private Dining", description: "Reserved evenings at the Smokehouse or in your home. A dedicated chef, your menu.", image: images.catering.privateDining },
    { title: "Office Lunch", description: "Recurring weekly drops for teams. Hot, considered, and on time.", image: images.catering.officeLunch },
  ],

  eventsSection: {
    label: "The Events",
    title: "What we cater",
  },

  packages: [
    { name: "Drop", description: "Single delivery, ready to serve. Best for office lunches and small gatherings.", image: images.catering.dropOff, bullets: ["Plated or family style", "Up to 30 guests", "Setup optional"] },
    { name: "Hosted", description: "We bring the chef, the kitchen, and the service. Best for weddings and corporate dinners.", image: images.catering.hostedBuffet, bullets: ["Up to 150 guests", "On-site service", "Bespoke menu"] },
    { name: "Smokehouse", description: "Our signature live-fire experience at your location. Weekend-only availability.", image: images.catering.smokehousePkg, bullets: ["Live fire on-site", "Up to 80 guests", "Pairings included"] },
  ],

  packagesSection: {
    label: "Packages",
    title: "How we work",
  },

  whyCeljoe: {
    eyebrow: "Why Celjoe",
    title: "One team, end to end",
    body: "We don't sub-contract. The chef who plans your menu is the chef who cooks it. That continuity is what makes the difference — it's also why our calendar fills up.",
    image: images.catering.luxuryBuffet,
  },

  testimonialsSection: {
    label: "Guests",
    title: "What they say",
  },

  testimonials: [
    { quote: "Celjoe didn't just cater our wedding — they hosted it. The team was invisible, the food was unforgettable.", attribution: "Tomi & Dara · Lekki" },
    { quote: "We use Celjoe for every product launch. Our guests always ask who's behind the kitchen.", attribution: "Lead, a Yaba-based fintech" },
  ],

  quotation: {
    label: "Quotation",
    title: "Request a consultation",
    description: "Tell us about the event. We'll reply with availability, suggested menus, and a clear quotation.",
  },
} as const;
