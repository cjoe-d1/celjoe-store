import ChdsCartDrawer from "components/cart/chds-cart-drawer";
import { Container, SearchBar, SearchBarSkeleton } from "components/chds";
import { LogoIcon } from "components/icons";
import Link from "next/link";
import { Suspense } from "react";
import NavbarChrome from "./chrome";
import MobileMenu, { type MobileNavItem } from "./mobile-menu";

const { SITE_NAME } = process.env;

const primaryNav: MobileNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Kitchen", href: "/kitchen" },
  { label: "BBQ", href: "/bbq" },
  { label: "Catering", href: "/catering" },
  { label: "Our Story", href: "/our-story" },
  { label: "Track Order", href: "/track-order" },
  { label: "Account", href: "/account" },
];

export async function Navbar() {
  return (
    <NavbarChrome>
      <nav aria-label="Primary">
        <Container className="flex items-center justify-between gap-[var(--ds-space-6)] py-[var(--ds-space-5)]">
          <div className="block flex-none md:hidden">
            <Suspense fallback={null}>
              <MobileMenu items={primaryNav} />
            </Suspense>
          </div>

          <div className="flex w-full items-center justify-between gap-[var(--ds-space-6)]">
            <div className="flex items-center gap-[var(--ds-space-10)]">
              <Link
                href="/"
                prefetch={true}
                aria-label={SITE_NAME ?? "Home"}
                className="flex items-center gap-[var(--ds-space-3)] text-[var(--ds-color-fg)] transition-opacity hover:opacity-80"
              >
                <LogoIcon className="h-6 w-auto" />
              </Link>
              <ul className="hidden items-center gap-[var(--ds-space-7)] md:flex">
                {primaryNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      className="text-[length:var(--ds-text-caption)] uppercase tracking-[0.18em] text-[var(--ds-color-muted)] underline-offset-4 transition-colors hover:text-[var(--ds-color-fg)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden md:flex md:flex-1 md:justify-center md:max-w-md">
              <Suspense fallback={<SearchBarSkeleton />}>
                <SearchBar />
              </Suspense>
            </div>

            <div className="flex items-center justify-end">
              <ChdsCartDrawer />
            </div>
          </div>
        </Container>
      </nav>
    </NavbarChrome>
  );
}
