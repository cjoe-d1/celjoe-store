"use client";

import { VariantSelector } from "components/chds";
import { AddToCart } from "components/cart/add-to-cart";
import { Product } from "lib/supabase/products";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ProductInteractive({ product }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = product.optionGroups.reduce((acc, group) => {
    acc[group.name.toLowerCase()] = searchParams.get(group.name.toLowerCase()) ?? undefined;
    return acc;
  }, {} as Record<string, string | undefined>);

  const handleChange = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v) {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <>
      <VariantSelector
        optionGroups={product.optionGroups}
        variants={product.variants}
        value={value}
        onChange={handleChange}
        className="mb-8"
      />
      <AddToCart product={product} />
    </>
  );
}
