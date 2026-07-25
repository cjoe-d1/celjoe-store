import type { ReactNode } from "react";

import { Container, Label, PageHeader, SectionTitle, Stack } from "components/chds";
import Footer from "components/layout/footer";
import { buildMetadata } from "lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

export const SECTIONS: { label: string; href: string; description: string }[] = [
  { label: "Overview", href: "/account", description: "Your account at a glance." },
  { label: "Orders", href: "/account/orders", description: "Order history and status." },
  { label: "Addresses", href: "/account/addresses", description: "Delivery addresses on file." },
  { label: "Wishlist", href: "/account/wishlist", description: "Meals you want to come back to." },
  { label: "Saved Meals", href: "/account/saved", description: "Reorder your favourites." },
  { label: "Notifications", href: "/account/notifications", description: "Choose what we tell you about." },
  { label: "Preferences", href: "/account/preferences", description: "Dietary notes and preferences." },
  { label: "Settings", href: "/account/settings", description: "Profile, email, and password." },
];

export function AccountShell({
  current,
  title,
  description,
  children,
}: {
  current: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow="Account" title={title} description={description} />
      <Container className="py-[var(--ds-space-12)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-10)] lg:grid-cols-[240px_1fr]">
          <aside>
            <nav aria-label="Account sections">
              <Label tone="muted" className="mb-[var(--ds-space-3)] block">
                Account
              </Label>
              <ul className="flex flex-col gap-[var(--ds-space-1)]">
                {SECTIONS.map((s) => {
                  const isCurrent = s.href === current;
                  return (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          "block rounded-[var(--ds-radius-md)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] transition-colors " +
                          (isCurrent
                            ? "bg-[var(--ds-color-accent)]/10 text-[var(--ds-color-fg)]"
                            : "text-[var(--ds-color-fg)] hover:bg-[var(--ds-color-surface-muted)]")
                        }
                      >
                        {s.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
          <Stack gap="5">
            <SectionTitle>{title}</SectionTitle>
            {children}
          </Stack>
        </div>
      </Container>
      <Footer />
    </>
  );
}

export function makeAccountMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return buildMetadata({ title, description, path });
}
