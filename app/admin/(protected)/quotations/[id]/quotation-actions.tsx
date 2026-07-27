"use client";

import { useState } from "react";
import { Button, Card, Label, TextInput, Textarea } from "components/chds";
import {
  updateQuotationStatusAction,
  updateQuotationNotesAction,
} from "lib/actions/quotations";
import { waChatUrl } from "lib/services/whatsapp";
import type { QuotationRow, QuotationStatus } from "lib/supabase/quotations";

type QuotationActionsProps = {
  quotation: QuotationRow;
};

type Result = { ok: true } | { ok: false; error: string };

const STATUS_TRANSITIONS: Record<
  QuotationStatus,
  { next: QuotationStatus; label: string } | null
> = {
  pending: { next: "quoted", label: "Send quotation" },
  quoted: { next: "accepted", label: "Mark as accepted" },
  accepted: { next: "completed", label: "Mark as completed" },
  completed: null,
  declined: null,
};

const REVERT_TRANSITIONS: Partial<
  Record<QuotationStatus, { prev: QuotationStatus; label: string }>
> = {
  quoted: { prev: "pending", label: "Move back to pending" },
  accepted: { prev: "quoted", label: "Move back to quoted" },
  completed: { prev: "accepted", label: "Move back to accepted" },
};

export function QuotationActions({ quotation }: QuotationActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotedAmount, setQuotedAmount] = useState(
    quotation.quoted_amount != null ? String(quotation.quoted_amount) : "",
  );
  const [adminNotes, setAdminNotes] = useState(quotation.admin_notes ?? "");
  const [activeAmountForm, setActiveAmountForm] = useState(false);
  const [activeNotesForm, setActiveNotesForm] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);

  const run = async (fn: () => Promise<Result>) => {
    setError(null);
    setIsPending(true);
    try {
      const result = await fn();
      if (!result.ok) {
        setError(result.error);
      } else {
        setActiveAmountForm(false);
        setDeclineOpen(false);
      }
    } finally {
      setIsPending(false);
    }
  };

  const nextTransition = STATUS_TRANSITIONS[quotation.status];
  const revertTransition = REVERT_TRANSITIONS[quotation.status];
  const isTerminal =
    quotation.status === "completed" || quotation.status === "declined";

  const whatsappLink = quotation.customer_phone
    ? waChatUrl(
        quotation.customer_phone,
        `Hi ${quotation.customer_name}, regarding your quotation ${quotation.quote_number}...`,
      )
    : null;

  return (
    <div className="flex flex-col gap-[var(--ds-space-4)]">
      {/* Status actions */}
      <Card variant="dashboard">
        <Label tone="muted">Status</Label>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-h4)] capitalize text-[var(--ds-color-fg)]">
          {quotation.status}
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
          {nextTransition && !isTerminal ? (
            <Button
              disabled={isPending}
              onClick={() => {
                if (nextTransition.next === "quoted" && !activeAmountForm) {
                  setActiveAmountForm(true);
                  return;
                }
                run(() =>
                  updateQuotationStatusAction(
                    quotation.id,
                    nextTransition.next,
                    quotedAmount ? Number(quotedAmount) : null,
                    adminNotes || null,
                  ),
                );
              }}
            >
              {nextTransition.label}
            </Button>
          ) : null}

          {revertTransition ? (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  updateQuotationStatusAction(
                    quotation.id,
                    revertTransition.prev,
                    quotation.quoted_amount,
                    quotation.admin_notes,
                  ),
                )
              }
            >
              {revertTransition.label}
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Quoted amount form */}
      {activeAmountForm && quotation.status === "pending" ? (
        <Card variant="dashboard">
          <Label tone="muted">Set quoted amount</Label>
          <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
            <TextInput
              type="number"
              min={0}
              step={1}
              value={quotedAmount}
              onChange={(e) => setQuotedAmount(e.target.value)}
              placeholder="Amount in NGN"
            />
            <div className="flex gap-[var(--ds-space-2)]">
              <Button
                disabled={isPending || !quotedAmount.trim()}
                onClick={() =>
                  run(() =>
                    updateQuotationStatusAction(
                      quotation.id,
                      "quoted",
                      Number(quotedAmount),
                      adminNotes || null,
                    ),
                  )
                }
              >
                Confirm & send
              </Button>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setActiveAmountForm(false);
                  setQuotedAmount(
                    quotation.quoted_amount != null
                      ? String(quotation.quoted_amount)
                      : "",
                  );
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Decline */}
      {!isTerminal ? (
        <Card variant="dashboard">
          <Label tone="muted">Decline</Label>
          {declineOpen ? (
            <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
              <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                This will mark the quotation as declined.
              </p>
              <div className="flex gap-[var(--ds-space-2)]">
                <Button
                  variant="danger"
                  disabled={isPending}
                  onClick={() =>
                    run(() =>
                      updateQuotationStatusAction(
                        quotation.id,
                        "declined",
                        quotation.quoted_amount,
                        quotation.admin_notes,
                      ),
                    )
                  }
                >
                  Confirm decline
                </Button>
                <Button
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => setDeclineOpen(false)}
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
              onClick={() => setDeclineOpen(true)}
            >
              Decline quotation
            </Button>
          )}
        </Card>
      ) : null}

      {/* WhatsApp quick contact */}
      {whatsappLink ? (
        <Card variant="dashboard">
          <Label tone="muted">Contact customer</Label>
          <Button
            variant="outline"
            className="mt-[var(--ds-space-3)] w-full"
            asChild
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              Open WhatsApp chat
            </a>
          </Button>
        </Card>
      ) : null}

      {/* Internal notes */}
      <Card variant="dashboard">
        <Label tone="muted">Internal notes</Label>
        {activeNotesForm ? (
          <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-2)]">
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal notes (not visible to customer)"
              rows={4}
            />
            <div className="flex gap-[var(--ds-space-2)]">
              <Button
                disabled={isPending}
                onClick={() =>
                  run(() =>
                    updateQuotationNotesAction(quotation.id, adminNotes),
                  )
                }
              >
                Save notes
              </Button>
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  setActiveNotesForm(false);
                  setAdminNotes(quotation.admin_notes ?? "");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-[var(--ds-space-2)] whitespace-pre-line text-[var(--ds-color-fg)]">
              {quotation.admin_notes ?? "No notes yet."}
            </p>
            <Button
              variant="ghost"
              className="mt-[var(--ds-space-3)] w-full"
              disabled={isPending}
              onClick={() => setActiveNotesForm(true)}
            >
              {quotation.admin_notes ? "Edit notes" : "Add notes"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
