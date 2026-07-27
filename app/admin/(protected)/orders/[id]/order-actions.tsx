"use client";

import { useState, useTransition } from "react";
import { Button, Card, Label, TextInput, Textarea } from "components/chds";
import {
  acceptOrderAction,
  cancelOrderAction,
  markOrderCompletedAction,
  markOrderPreparingAction,
  markOrderReadyAction,
  recallOrderAction,
  refundOrderAction,
  updateOrderNotesAction,
} from "lib/actions/orders";
import { statusLabel, type Order, type OrderStatus } from "lib/supabase/orders";

type OrderActionsProps = {
  order: Order;
  canManage: boolean;
};

type Result = { ok: true } | { ok: false; error: string };

const STAGE_NEXT: Record<OrderStatus, { next: OrderStatus; label: string } | null> = {
  pending: { next: "confirmed", label: "Accept order" },
  confirmed: { next: "preparing", label: "Mark as preparing" },
  preparing: { next: "ready", label: "Mark as ready" },
  ready: { next: "completed", label: "Mark as completed" },
  completed: null,
  cancelled: null,
};

const STAGE_PREV: Partial<Record<OrderStatus, { prev: OrderStatus; label: string }>> = {
  confirmed: { prev: "pending", label: "Move back to pending" },
  preparing: { prev: "confirmed", label: "Move back to confirmed" },
  ready: { prev: "preparing", label: "Move back to preparing" },
  completed: { prev: "ready", label: "Recall" },
};

export function OrderActions({ order, canManage }: OrderActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(
    String(order.paymentStatus === "paid" ? order.total : 0),
  );
  const [activeForm, setActiveForm] = useState<
    "next" | "prev" | "cancel" | "refund" | "notes" | null
  >(null);

  const run = (fn: () => Promise<Result>, form: typeof activeForm) => {
    setError(null);
    setActiveForm(form);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
      } else {
        setActiveForm(null);
      }
    });
  };

  const nextStage = STAGE_NEXT[order.orderStatus];
  const prevStage = STAGE_PREV[order.orderStatus];
  const isTerminal =
    order.orderStatus === "completed" || order.orderStatus === "cancelled";

  if (!canManage) {
    return (
      <Card variant="dashboard">
        <Label tone="muted">Status</Label>
        <p className="mt-[var(--ds-space-2)] text-[var(--ds-color-fg)]">
          {statusLabel(order.orderStatus)}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--ds-space-4)]">
      <Card variant="dashboard">
        <Label tone="muted">Status</Label>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-h4)] text-[var(--ds-color-fg)]">
          {statusLabel(order.orderStatus)}
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-2)]">
          {nextStage && !isTerminal ? (
            <Button
              disabled={isPending}
              onClick={() => {
                const fn =
                  order.orderStatus === "pending"
                    ? () => acceptOrderAction(order.id)
                    : order.orderStatus === "confirmed"
                    ? () => markOrderPreparingAction(order.id)
                    : order.orderStatus === "preparing"
                    ? () => markOrderReadyAction(order.id)
                    : () => markOrderCompletedAction(order.id);
                run(fn, "next");
              }}
            >
              {nextStage.label}
            </Button>
          ) : null}
          {prevStage ? (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => {
                const fn =
                  order.orderStatus === "completed"
                    ? () => recallOrderAction(order.id)
                    : order.orderStatus === "ready"
                    ? () => markOrderPreparingAction(order.id)
                    : order.orderStatus === "preparing"
                    ? () => markOrderReadyAction(order.id) // unused fallback
                    : order.orderStatus === "confirmed"
                    ? () => acceptOrderAction(order.id) // unused fallback
                    : () => Promise.resolve({ ok: true } as const);
                run(fn, "prev");
              }}
            >
              {prevStage.label}
            </Button>
          ) : null}
        </div>
      </Card>

      {!isTerminal ? (
        <Card variant="dashboard">
          <Label tone="muted">Cancel order</Label>
          {activeForm === "cancel" ? (
            <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (visible in audit log)"
                rows={3}
              />
              <div className="flex gap-[var(--ds-space-2)]">
                <Button
                  variant="danger"
                  disabled={isPending || !cancelReason.trim()}
                  onClick={() =>
                    run(
                      () => cancelOrderAction(order.id, cancelReason.trim()),
                      "cancel",
                    )
                  }
                >
                  Confirm cancel
                </Button>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => {
                    setActiveForm(null);
                    setCancelReason("");
                  }}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-[var(--ds-space-3)] w-full"
              disabled={isPending}
              onClick={() => setActiveForm("cancel")}
            >
              Cancel this order
            </Button>
          )}
        </Card>
      ) : null}

      {order.paymentStatus === "paid" && order.orderStatus !== "cancelled" ? (
        <Card variant="dashboard">
          <Label tone="muted">Refund</Label>
          {activeForm === "refund" ? (
            <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              <TextInput
                type="number"
                min={0}
                step={1}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
              <div className="flex gap-[var(--ds-space-2)]">
                <Button
                  variant="primary"
                  disabled={
                    isPending || Number(refundAmount) <= 0
                  }
                  onClick={() =>
                    run(
                      () => refundOrderAction(order.id, Number(refundAmount)),
                      "refund",
                    )
                  }
                >
                  Issue refund
                </Button>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => setActiveForm(null)}
                >
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-[var(--ds-space-3)] w-full"
              disabled={isPending}
              onClick={() => setActiveForm("refund")}
            >
              Issue a refund
            </Button>
          )}
        </Card>
      ) : null}

      <Card variant="dashboard">
        <Label tone="muted">Internal notes</Label>
        {activeForm === "notes" ? (
          <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (not shown to customer)"
              rows={4}
            />
            <div className="flex gap-[var(--ds-space-2)]">
              <Button
                disabled={isPending}
                onClick={() =>
                  run(() => updateOrderNotesAction(order.id, notes), "notes")
                }
              >
                Save notes
              </Button>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setActiveForm(null);
                  setNotes(order.notes ?? "");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-[var(--ds-space-2)] whitespace-pre-line text-[var(--ds-color-fg)]">
              {order.notes ?? "No notes yet."}
            </p>
            <Button
              variant="ghost"
              className="mt-[var(--ds-space-3)] w-full"
              disabled={isPending}
              onClick={() => setActiveForm("notes")}
            >
              {order.notes ? "Edit notes" : "Add notes"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
