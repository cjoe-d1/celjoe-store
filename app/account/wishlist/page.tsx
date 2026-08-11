import type { Metadata } from "next";

import { Alert, Button, ProductCard } from "components/chds";
import { AccountShell } from "../_shell";
import { toProductCardModel } from "lib/product-helpers";
import { getFeaturedProducts } from "lib/supabase/products";
import { getCurrentCustomerSession } from "lib/auth/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Meals you want to come back to.",
};

export default async function WishlistPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/wishlist");
  }
  const suggested = await getFeaturedProducts().catch(() => []);

  return (
    <AccountShell
      current="/account/wishlist"
      title="Wishlist"
      description="Meals you want to come back to."
    >
      <Alert tone="info" title="Your wishlist is empty">
        Save meals you love to reorder in a single tap.
      </Alert>
      {suggested.length > 0 ? (
        <>
          <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            A few you might like
          </p>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2 lg:grid-cols-3">
            {suggested.slice(0, 6).map((p) => (
              <ProductCard key={p.id} product={toProductCardModel(p)} />
            ))}
          </div>
          <div>
            <Button asChild variant="outline">
              <Link href="/kitchen">See the full kitchen</Link>
            </Button>
          </div>
        </>
      ) : null}
    </AccountShell>
  );
}
