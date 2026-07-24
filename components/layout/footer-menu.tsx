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
          "block p-2 text-lg underline-offset-4 hover:text-black hover:underline md:inline-block md:text-sm dark:hover:text-neutral-300",
          {
            "text-black dark:text-neutral-300": active,
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
