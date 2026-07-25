import type { Metadata } from "next";
import { Suspense } from "react";

import { Container, PageHeader } from "components/chds";
import Footer from "components/layout/footer";
import { buildMetadata } from "lib/seo";
import CartPageContent from "./cart-page-content";

export const metadata: Metadata = buildMetadata({
  title: "Cart",
  description: "Your Celjoe cart.",
  path: "/cart",
  noIndex: true,
});

function CartSkeleton() {
  return (
    <Container className="py-[var(--ds-space-16)]">
      <div className="h-[200px] w-full animate-pulse rounded-[var(--ds-radius-xl)] bg-[var(--ds-color-surface-muted)]" />
    </Container>
  );
}

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="Cart" title="My cart" description="The meals waiting for you." />
      <Suspense fallback={<CartSkeleton />}>
        <CartPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
