import { Navbar } from "components/layout/navbar";
import { WelcomeToast } from "components/welcome-toast";
import { Montserrat } from "next/font/google";
import { getCart } from "lib/supabase/cart";
import { ReactNode } from "react";
import { AppProviders } from "providers/app-providers";
import "./globals.css";
import { baseUrl } from "lib/utils";

const { SITE_NAME } = process.env;

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

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
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Don't await the fetch, pass the Promise to the context provider
  const cart = getCart();

  return (
    <html lang="en" className={montserrat.variable} data-theme="celjoe">
      <body className="bg-[var(--ds-color-bg)] [font-family:var(--ds-font-sans)] text-[var(--ds-color-fg)] selection:bg-[var(--ds-color-accent)] selection:text-white">
        <AppProviders cartPromise={cart}>
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
