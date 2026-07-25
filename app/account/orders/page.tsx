import type { Metadata } from "next";

import { Alert, Badge, Button } from "components/chds";
import Link from "next/link";
import { AccountShell } from "../_shell";
import { statusLabel } from "lib/supabase/orders";

export const metadata: Metadata = {
  title: "Orders",
  description: "Your Celjoe order history.",
};

export default function OrdersPage() {
  return (
    <AccountShell
      current="/account/orders"
      title="Orders"
      description="Order history and live status."
    >
      <Alert tone="info" title="No orders yet">
        When you place an order, it will appear here with live status updates.
      </Alert>
      <div className="flex flex-wrap gap-[var(--ds-space-3)]">
        <Button asChild>
          <Link href="/kitchen">Browse the kitchen</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/track-order">Track an order</Link>
        </Button>
      </div>
      <div className="rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
        <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          The order status flow is:{" "}
          <Badge tone="neutral">Order received</Badge>{" "}
          <Badge tone="neutral">Confirmed</Badge>{" "}
          <Badge tone="neutral">Preparing</Badge>{" "}
          <Badge tone="neutral">Ready</Badge>{" "}
          <Badge tone="neutral">On the way</Badge>{" "}
          <Badge tone="neutral">Delivered</Badge>
        </p>
        <p className="mt-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          Current label: {statusLabel("preparing")}
        </p>
      </div>
    </AccountShell>
  );
}
