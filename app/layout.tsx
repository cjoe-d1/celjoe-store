import { AmbientBackground } from "components/ambient-background";
import { Navbar } from "components/layout/navbar";
import { WelcomeToast } from "components/welcome-toast";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import { getCart } from "lib/supabase/cart";
import { ReactNode } from "react";
import { AppProviders } from "providers/app-providers";
import { PwaProvider } from "components/pwa/pwa-provider";
import { organizationJsonLd, websiteJsonLd, localBusinessJsonLd, renderJsonLd } from "lib/seo";
import { siteConfig } from "lib/site-config";
import "./globals.css";
import { baseUrl } from "lib/utils";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  robots: {
    follow: true,
    index: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    description: siteConfig.description,
    images: [{ url: `${baseUrl}/og-image.jpg`, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitter,
    creator: siteConfig.twitter,
    description: siteConfig.description,
    images: [`${baseUrl}/og-image.jpg`],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CELJOE",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="en" style={{ "--font-montserrat": `"Montserrat", sans-serif` } as React.CSSProperties} data-theme="celjoe">
      <body className="bg-[var(--ds-color-bg)] [font-family:var(--ds-font-sans)] text-[var(--ds-color-fg)] selection:bg-[var(--ds-color-accent)] selection:text-white">
        <AmbientBackground />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: renderJsonLd(localBusinessJsonLd()) }}
        />
        <AppProviders cartPromise={cart}>
          <PwaProvider />
          <Navbar />
          <main>
            {children}
            <WelcomeToast />
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
