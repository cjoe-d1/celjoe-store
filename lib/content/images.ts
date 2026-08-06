/**
 * CELJOE Curated Image Registry — Phase J
 *
 * Single source of truth for every presentation image used across the
 * application. All images are curated Unsplash photography specified in
 * the official CELJOE Image Manifest.
 *
 * No page component should hardcode image paths.
 * Every page must import from this file.
 */

const IMG = "/images";

export const images = {
  /* ── Homepage (14 assets) ── */
  home: {
    hero: `${IMG}/home/celjoe-home-hero.jpg`,
    todaysKitchen: `${IMG}/home/celjoe-home-todays-kitchen.jpg`,
    smokehouse: `${IMG}/home/celjoe-home-smokehouse.jpg`,
    chefRecommendation: `${IMG}/home/celjoe-home-chef-recommendation.jpg`,
    categoriesBanner: `${IMG}/home/celjoe-home-categories-banner.jpg`,
    kitchenPreview: `${IMG}/home/celjoe-home-kitchen-preview.jpg`,
    bbqPreview: `${IMG}/home/celjoe-home-bbq-preview.jpg`,
    cateringPreview: `${IMG}/home/celjoe-home-catering-preview.jpg`,
    avatar1: `${IMG}/home/celjoe-home-avatar-1.jpg`,
    avatar2: `${IMG}/home/celjoe-home-avatar-2.jpg`,
    avatar3: `${IMG}/home/celjoe-home-avatar-3.jpg`,
    avatar4: `${IMG}/home/celjoe-home-avatar-4.jpg`,
    avatar5: `${IMG}/home/celjoe-home-avatar-5.jpg`,
    ctaBg: `${IMG}/home/celjoe-home-cta-bg.jpg`,
  },

  /* ── Kitchen (7 assets) ── */
  kitchen: {
    hero: `${IMG}/kitchen/celjoe-kitchen-hero.jpg`,
    ingredients: `${IMG}/kitchen/celjoe-kitchen-ingredients.jpg`,
    chefPrep: `${IMG}/kitchen/celjoe-kitchen-chef-prep.jpg`,
    signatureDish: `${IMG}/kitchen/celjoe-kitchen-signature-dish.jpg`,
    atmosphere: `${IMG}/kitchen/celjoe-kitchen-atmosphere.jpg`,
    menuBanner: `${IMG}/kitchen/celjoe-kitchen-menu-banner.jpg`,
    ctaBg: `${IMG}/kitchen/celjoe-kitchen-cta-bg.jpg`,
  },

  /* ── BBQ / Smokehouse (8 assets) ── */
  bbq: {
    hero: `${IMG}/bbq/celjoe-bbq-hero.jpg`,
    liveGrill: `${IMG}/bbq/celjoe-bbq-live-grill.jpg`,
    smokehouseProcess: `${IMG}/bbq/celjoe-bbq-smokehouse-process.jpg`,
    chefAtGrill: `${IMG}/bbq/celjoe-bbq-chef-at-grill.jpg`,
    meatCloseup: `${IMG}/bbq/celjoe-bbq-meat-closeup.jpg`,
    platter: `${IMG}/bbq/celjoe-bbq-platter.jpg`,
    pairings: `${IMG}/bbq/celjoe-bbq-pairings.jpg`,
    ctaBg: `${IMG}/bbq/celjoe-bbq-cta-bg.jpg`,
  },

  /* ── Catering (12 assets) ── */
  catering: {
    hero: `${IMG}/catering/celjoe-catering-hero.jpg`,
    luxuryBuffet: `${IMG}/catering/celjoe-catering-luxury-buffet.jpg`,
    wedding: `${IMG}/catering/celjoe-catering-wedding.jpg`,
    corporate: `${IMG}/catering/celjoe-catering-corporate.jpg`,
    birthday: `${IMG}/catering/celjoe-catering-birthday.jpg`,
    outdoor: `${IMG}/catering/celjoe-catering-outdoor.jpg`,
    privateDining: `${IMG}/catering/celjoe-catering-private-dining.jpg`,
    officeLunch: `${IMG}/catering/celjoe-catering-office-lunch.jpg`,
    dropOff: `${IMG}/catering/celjoe-catering-drop-off.jpg`,
    hostedBuffet: `${IMG}/catering/celjoe-catering-hosted-buffet.jpg`,
    smokehousePkg: `${IMG}/catering/celjoe-catering-smokehouse-pkg.jpg`,
    quotationCta: `${IMG}/catering/celjoe-catering-quotation-cta.jpg`,
  },

  /* ── Our Story (11 assets) ── */
  story: {
    hero: `${IMG}/story/celjoe-story-hero.jpg`,
    foundersKitchen: `${IMG}/story/celjoe-story-founders-kitchen.jpg`,
    team: `${IMG}/story/celjoe-story-team.jpg`,
    foodPrep: `${IMG}/story/celjoe-story-food-prep.jpg`,
    ingredients: `${IMG}/story/celjoe-story-ingredients.jpg`,
    presentation: `${IMG}/story/celjoe-story-presentation.jpg`,
    hospitality: `${IMG}/story/celjoe-story-hospitality.jpg`,
    craftsmanship: `${IMG}/story/celjoe-story-craftsmanship.jpg`,
    kitchenInterior: `${IMG}/story/celjoe-story-kitchen-interior.jpg`,
    timeline: `${IMG}/story/celjoe-story-timeline.jpg`,
    ctaBg: `${IMG}/story/celjoe-story-cta-bg.jpg`,
  },

  /* ── Global (3 assets) ── */
  global: {
    testimonials: `${IMG}/global/celjoe-global-testimonials.jpg`,
    catPlaceholder: `${IMG}/global/celjoe-global-cat-placeholder.jpg`,
    prodPlaceholder: `${IMG}/global/celjoe-global-prod-placeholder.jpg`,
  },
} as const;
