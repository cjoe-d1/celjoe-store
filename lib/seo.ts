import type { Metadata } from "next";
import { siteConfig } from "./site-config";

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
};

const TITLE_SUFFIX = ` — ${siteConfig.name}`;

export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex,
  type = "website",
}: BuildMetadataOptions = {}): Metadata {
  const resolvedTitle = title ? `${title}${TITLE_SUFFIX}` : `${siteConfig.name} — ${siteConfig.tagline}`;
  const resolvedDescription = description ?? siteConfig.description;
  const url = path ? new URL(path, siteConfig.url).toString() : siteConfig.url;
  const ogImage = image ? new URL(image, siteConfig.url).toString() : undefined;

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
      images: ogImage ? [{ url: ogImage, alt: resolvedTitle }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      title: resolvedTitle,
      description: resolvedDescription,
      images: ogImage ? [ogImage] : undefined,
    },
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    servesCuisine: ["African", "BBQ", "Catering"],
    priceRange: "₦₦",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
    },
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

export function renderJsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
