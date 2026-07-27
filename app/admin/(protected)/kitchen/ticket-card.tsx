"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button } from "components/chds";
import {
  markOrderReadyAction,
  markOrderCompletedAction,
  recallOrderAction,
} from "lib/actions/orders";
import type { AdminOrder } from "lib/supabase/admin/orders";

type Props = {
  order: AdminOrder;
  tone: "preparing" | "ready" | "completed";
  totalLabel: string;
};

export function KitchenTicketCard({ order, tone, totalLabel }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(order.createdAt).getTime();
    const tick = () => {
      const seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
      const ss = (seconds % 60).toString().padStart(2, "0");
      setElapsed(`${mm}:${ss}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [order.createdAt]);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const r = await action();
      if (!r.ok) {
        setError(r.error ?? "Action failed.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card variant="order" className="flex flex-col gap-[var(--ds-space-2)]">
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] hover:text-[var(--ds-color-accent)]"
        >
          {order.orderNumber}
        </Link>
        <span className="rounded-full bg-[var(--ds-color-surface-muted)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          {elapsed}
        </span>
      </div>
      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
        {order.customerName} · {totalLabel}
      </div>
      <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
        {(order.items ?? []).slice(0, 8).map((line) => (
          <li key={line.id} className="flex items-center justify-between">
            <span>
              {line.productName}
              {line.variantName ? ` (${line.variantName})` : ""}
            </span>
            <span className="text-[var(--ds-color-muted)]">×{line.quantity}</span>
          </li>
        ))}
      </ul>
      {order.notes ? (
        <p className="rounded-[var(--ds-radius-md)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          Note: {order.notes}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </p>
      ) : null}
      <div className="mt-[var(--ds-space-2)] flex flex-wrap gap-[var(--ds-space-2)]">
        {tone === "preparing" ? (
          <>
            <Button size="sm" variant="primary" disabled={pending} onClick={() => run(() => markOrderReadyAction(order.id))}>
              Mark ready
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => recallOrderAction(order.id))}>
              Recall
            </Button>
          </>
        ) : null}
        {tone === "ready" ? (
          <Button size="sm" variant="primary" disabled={pending} onClick={() => run(() => markOrderCompletedAction(order.id))}>
            Mark completed
          </Button>
        ) : null}
        <Button asChild size="sm" variant="ghost">
          <Link href={`/admin/orders/${order.id}`}>View</Link>
        </Button>
      </div>
    </Card>
  );
}
