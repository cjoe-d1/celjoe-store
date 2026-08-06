/**
 * Site configuration. Single source of truth for the storefront brand.
 */
export const siteConfig = {
  name: process.env.SITE_NAME || "Celjoe Store",
  company: process.env.COMPANY_NAME || "Celjoe",
  description:
    "Celjoe is Lagos' destination for elevated dining, handcrafted cold-pressed juices, gourmet catering, signature smokehouse cuisine, wholesome Nigerian meals, and luxury hospitality experiences — crafted fresh and delivered with excellence.",
  tagline: "Hospitality before technology.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  twitter: "@celjoestore",
  locale: "en-NG",
  currency: "NGN",
  contact: {
    email: process.env.CONTACT_EMAIL || "hello@celjoe.store",
    phone: process.env.CONTACT_PHONE || "+234 906 000 4533",
    whatsapp: process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP || "2349060004533",
  },
  social: {
    instagram: process.env.SOCIAL_INSTAGRAM || "https://instagram.com/celjoestore",
    facebook: process.env.SOCIAL_FACEBOOK || "https://facebook.com/celjoestore",
    twitter: process.env.SOCIAL_TWITTER || "https://x.com/celjoestore",
  },
  navigation: {
    primary: [
      { label: "Home", href: "/" },
      { label: "Kitchen", href: "/kitchen" },
      { label: "BBQ", href: "/bbq" },
      { label: "Catering", href: "/catering" },
      { label: "Our Story", href: "/our-story" },
      { label: "Track Order", href: "/track-order" },
      { label: "Account", href: "/account" },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
