"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoIcon } from "components/icons";
import {
  AdminSidebar,
  type AdminNavItem,
} from "components/chds/admin";

const NAV: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    description: "Operations overview",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/admin/orders",
    description: "Live and historical orders",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M4 7h16l-1 12H5L4 7Z" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
      </svg>
    ),
  },
  {
    label: "Kitchen",
    href: "/admin/kitchen",
    description: "Kitchen Display",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M5 12c0-3 3-5 7-5s7 2 7 5" />
        <path d="M5 12v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
        <path d="M9 17v2" />
        <path d="M15 17v2" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/admin/products",
    description: "Menu and Smokehouse",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    description: "Ingredients, stock, suppliers",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M3 7h18l-2 13H5L3 7Z" />
        <path d="M8 7V5a4 4 0 0 1 8 0v2" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/admin/customers",
    description: "Guest directory",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="9" cy="8" r="4" />
        <path d="M2 21a7 7 0 0 1 14 0" />
        <circle cx="17" cy="9" r="3" />
        <path d="M22 19a5 5 0 0 0-7-4.5" />
      </svg>
    ),
  },
  {
    label: "Quotations",
    href: "/admin/quotations",
    description: "Requests and quotes",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8" />
        <path d="M8 11h6" />
      </svg>
    ),
  },
  {
    label: "CMS",
    href: "/admin/cms",
    description: "Content and pages",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 4v16" />
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/admin/reports",
    description: "Insights and exports",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5" />
        <path d="M12 16V8" />
        <path d="M16 16v-3" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    description: "Business and security",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.5-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2L5 5.8l-2 3.5 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.5 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.5-2-1.5c.1-.4.1-.8.1-1.2Z" />
      </svg>
    ),
  },
  {
    label: "Audit Log",
    href: "/admin/audit",
    description: "Activity history",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M4 4h12l4 4v12H4z" />
        <path d="M16 4v4h4" />
        <path d="M8 12h8" />
        <path d="M8 16h6" />
      </svg>
    ),
  },
];

export function AdminShell({
  fullName,
  email,
  roleLabel,
  children,
}: {
  fullName: string;
  email: string;
  roleLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={clsx(
        "grid min-h-[calc(100vh-0px)] grid-cols-1 bg-[var(--ds-color-bg)]",
        "md:grid-cols-[260px_1fr]",
      )}
    >
      <aside
        className={clsx(
          "hidden border-r border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] md:block",
        )}
      >
        <div className="flex items-center gap-[var(--ds-space-3)] border-b border-[var(--ds-color-border)] px-[var(--ds-space-5)] py-[var(--ds-space-5)]">
          <Link
            href="/admin"
            aria-label="Operations home"
            className="flex items-center gap-[var(--ds-space-3)] text-[var(--ds-color-fg)]"
          >
            <LogoIcon className="h-6 w-auto" />
            <span className="text-[length:var(--ds-text-label)] uppercase tracking-[0.18em] text-[var(--ds-color-muted)]">
              Operations
            </span>
          </Link>
        </div>
        <AdminSidebar items={NAV} currentPath={pathname} />
      </aside>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Operations navigation"
        >
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-full border-r border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--ds-color-border)] px-[var(--ds-space-4)] py-[var(--ds-space-4)]">
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-[var(--ds-space-2)] text-[var(--ds-color-fg)]"
              >
                <LogoIcon className="h-6 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] px-[var(--ds-space-3)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]"
              >
                Close
              </button>
            </div>
            <AdminSidebar
              items={NAV}
              currentPath={pathname}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-between gap-[var(--ds-space-3)] border-b border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-4)] py-[var(--ds-space-3)] md:px-[var(--ds-space-6)]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)] md:hidden"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <div className="ml-auto flex items-center gap-[var(--ds-space-3)]">
            <div className="hidden text-right md:block">
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
                {fullName}
              </div>
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                {roleLabel} · {email}
              </div>
            </div>
            <form action="/admin/signout" method="post">
              <button
                type="submit"
                className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-[var(--ds-color-bg)]">{children}</main>
      </div>
    </div>
  );
}
