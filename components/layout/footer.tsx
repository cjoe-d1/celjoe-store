import Link from "next/link";

import { Container, Label } from "components/chds";
import LogoImage from "components/logo";
import FooterMenu from "components/layout/footer-menu";
import { getCategories } from "lib/supabase/categories";
import { getPublishedPageLinks } from "lib/supabase/pages";
import { Suspense } from "react";

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const exploreLinks = [
    { label: "Home", href: "/" },
    { label: "Kitchen", href: "/kitchen" },
    { label: "BBQ", href: "/bbq" },
    { label: "Catering", href: "/catering" },
  ];

  const supportLinks = [
    { label: "Track Order", href: "/track-order" },
    { label: "Account", href: "/account" },
    { label: "Cart", href: "/cart" },
  ];

  const currentYear = new Date().getFullYear();
  const copyrightDate = 2023 + (currentYear > 2023 ? `-${currentYear}` : "");
  const skeleton =
    "h-6 w-full animate-pulse rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-surface-muted)]";
  const [categories, pages] = await Promise.all([
    getCategories({ parentId: null }),
    getPublishedPageLinks(),
  ]);
  const copyrightName = COMPANY_NAME || SITE_NAME || "";

  return (
    <footer className="border-t border-[var(--ds-color-border)] bg-[var(--ds-color-bg)]">
      <Container className="py-[var(--ds-space-16)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-12)] md:grid-cols-12">
          <div className="md:col-span-4">
            <Link
              className="flex items-center gap-[var(--ds-space-3)] text-[var(--ds-color-fg)]"
              href="/"
            >
              <LogoImage className="h-6" />
            </Link>
            <p className="mt-[var(--ds-space-4)] max-w-sm text-[length:var(--ds-text-body)] leading-relaxed text-[var(--ds-color-muted)]">
              From our kitchen to your table — crafted with care, served with heart.
            </p>
          </div>

          <div className="md:col-span-2">
            <Label className="text-[var(--ds-color-muted)]">Explore</Label>
            <ul className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-2)]">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] underline-offset-4 transition-colors hover:text-[var(--ds-color-accent)] hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <Label className="text-[var(--ds-color-muted)]">Kitchen</Label>
            <div className="mt-[var(--ds-space-4)]">
              <Suspense
                fallback={
                  <div className="flex w-full flex-col gap-[var(--ds-space-2)]">
                    <div className={skeleton} />
                    <div className={skeleton} />
                    <div className={skeleton} />
                    <div className={skeleton} />
                    <div className={skeleton} />
                    <div className={skeleton} />
                  </div>
                }
              >
                <FooterMenu categories={categories} />
              </Suspense>
            </div>
          </div>

          <div className="md:col-span-3">
            <Label className="text-[var(--ds-color-muted)]">Company</Label>
            <ul className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-2)]">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] underline-offset-4 transition-colors hover:text-[var(--ds-color-accent)] hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {pages.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={`/${page.slug}`}
                    className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] underline-offset-4 transition-colors hover:text-[var(--ds-color-accent)] hover:underline"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
      <div className="border-t border-[var(--ds-color-border)]">
        <Container className="py-[var(--ds-space-6)]">
          <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            &copy; {copyrightDate} {copyrightName}
            {copyrightName.length && !copyrightName.endsWith(".")
              ? "."
              : ""}{" "}
            All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
