import type { Metadata } from "next";

import { Button, KpiCard } from "components/chds";
import Link from "next/link";

import { AccountShell } from "./_shell";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Your Celjoe account — orders, addresses, saved meals, notifications, and preferences.",
};

export default function AccountPage() {
  return (
    <AccountShell
      current="/account"
      title="Overview"
      description="Your account, your orders, your preferences — all in one quiet place."
    >
      <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
        <KpiCard label="Recent order" value="—" hint="Place an order to see it here." />
        <KpiCard label="Saved meals" value="0" hint="Save meals to reorder in a tap." />
        <KpiCard label="Addresses" value="0" hint="Add a delivery address to speed up checkout." />
        <KpiCard label="Loyalty" value="Coming soon" hint="A rewards programme is on the way." />
      </div>

      <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
        <h3 className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Add a delivery address
        </h3>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          With a saved address, checkout takes a single tap.
        </p>
        <div className="mt-[var(--ds-space-4)]">
          <Button asChild>
            <Link href="/account/addresses">Add an address</Link>
          </Button>
        </div>
      </div>
    </AccountShell>
  );
}
