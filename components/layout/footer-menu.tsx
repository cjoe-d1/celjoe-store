"use client";

import clsx from "clsx";
import type { Category } from "lib/supabase/categories";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function FooterMenuItem({ category }: { category: Category }) {
  const pathname = usePathname();
  const path = `/search/${category.slug}`;
  const [active, setActive] = useState(pathname === path);

  useEffect(() => {
    setActive(pathname === path);
  }, [pathname, path]);

  return (
    <li>
      <Link
        href={path}
        className={clsx(
          "block px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)] underline-offset-4 hover:text-[var(--ds-color-fg)] hover:underline md:text-[length:var(--ds-text-caption)]",
          {
            "text-[var(--ds-color-fg)]": active,
          },
        )}
      >
        {category.name}
      </Link>
    </li>
  );
}

export default function FooterMenu({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <nav>
      <ul>
        {categories.map((category) => {
          return <FooterMenuItem key={category.id} category={category} />;
        })}
      </ul>
    </nav>
  );
}
