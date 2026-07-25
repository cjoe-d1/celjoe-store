/**
 * Site configuration. Single source of truth for the storefront brand.
 */
export const siteConfig = {
  name: process.env.SITE_NAME || "Celjoe Store",
  company: process.env.COMPANY_NAME || "Celjoe",
  description:
    "From our kitchen to your table — crafted with care, served with heart. A premium hospitality food platform.",
  tagline: "Hospitality before technology.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  twitter: "@celjoestore",
  locale: "en-NG",
  currency: "NGN",
  contact: {
    email: process.env.CONTACT_EMAIL || "hello@celjoe.store",
    phone: process.env.CONTACT_PHONE || "+234 000 0000",
    whatsapp: process.env.WHATSAPP_NUMBER || "",
  },
  social: {
    instagram: process.env.SOCIAL_INSTAGRAM || "",
    facebook: process.env.SOCIAL_FACEBOOK || "",
    twitter: process.env.SOCIAL_TWITTER || "",
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
