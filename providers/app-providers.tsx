"use client";

import { CartProvider } from "components/cart/cart-context";
import { ThemeProvider } from "providers/theme-provider";
import { Toaster } from "sonner";

export function AppProviders({
  children,
  cartPromise,
}: {
  children: React.ReactNode;
  cartPromise: Parameters<typeof CartProvider>[0]["cartPromise"];
}) {
  return (
    <ThemeProvider>
      <CartProvider cartPromise={cartPromise}>
        {children}
        <Toaster closeButton />
      </CartProvider>
    </ThemeProvider>
  );
}

