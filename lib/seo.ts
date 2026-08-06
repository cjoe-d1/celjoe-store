import type { Metadata } from "next";
import { siteConfig } from "./site-config";

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

const TITLE_SUFFIX = ` | ${siteConfig.name}`;

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  type = "website",
  publishedTime,
  modifiedTime,
}: BuildMetadataOptions = {}): Metadata {
  const resolvedTitle = title
    ? `${title}${TITLE_SUFFIX}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const resolvedDescription = description ?? siteConfig.description;
  const url = path
    ? new URL(path, siteConfig.url).toString()
    : siteConfig.url;
  const ogImage = image
    ? { url: new URL(image, siteConfig.url).toString(), alt: resolvedTitle }
    : undefined;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      title: resolvedTitle,
      description: resolvedDescription,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: ogImage
        ? [ogImage]
        : [{ url: `${siteConfig.url}/og-image.jpg`, alt: resolvedTitle }],
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title: resolvedTitle,
      description: resolvedDescription,
      images: ogImage
        ? [ogImage.url]
        : [`${siteConfig.url}/og-image.jpg`],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    ...(publishedTime
      ? {
          openGraph: {
            ...(ogImage
              ? { images: [ogImage] }
              : { images: [{ url: `${siteConfig.url}/og-image.jpg`, alt: resolvedTitle }] }),
            type: "article" as const,
            publishedTime,
            modifiedTime: modifiedTime ?? publishedTime,
            url,
            title: resolvedTitle,
            description: resolvedDescription,
            siteName: siteConfig.name,
            locale: siteConfig.locale,
          },
        }
      : {}),
  };
}

// --------------------------------------------------------------------------
// JSON-LD Structured Data
// --------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: ["African", "Nigerian", "BBQ", "Catering", "Healthy"],
    priceRange: "₦₦",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      availableLanguage: ["en"],
    },
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.twitter,
    ].filter(Boolean),
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#localbusiness`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
    priceRange: "₦₦",
    servesCuisine: "Nigerian, BBQ, Catering",
  };
}

export function foodEstablishmentJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "@id": `${siteConfig.url}/#foodestablishment`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: ["African", "Nigerian", "BBQ", "Catering"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lagos",
      addressCountry: "NG",
    },
  };
}

export function productJsonLd(product: {
  name: string;
  description?: string | null;
  image?: string;
  price: number;
  currency?: string;
  isAvailable?: boolean;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.image,
    url: product.url,
    offers: {
      "@type": "Offer",
      availability: product.isAvailable
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      price: product.price,
      priceCurrency: product.currency ?? siteConfig.currency,
      url: product.url,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.href, siteConfig.url).toString(),
    })),
  };
}

export function renderJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
