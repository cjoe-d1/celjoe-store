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
import "./globals.css";
import { baseUrl } from "lib/utils";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  robots: {
    follow: true,
    index: true,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CELJOE Admin",
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
