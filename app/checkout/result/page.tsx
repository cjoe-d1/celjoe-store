"use client";

/**
 * Payment Result Page
 *
 * Security-first: NEVER trusts browser-supplied status indicators.
 * The ONLY input is the Paystack transaction reference from the URL.
 * Server-side verification determines the actual payment state.
 *
 * Safe to refresh — idempotent by design.
 */

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "components/chds";
import { SuccessSummary } from "components/chds/checkout";
import { verifyPaymentAction, getOrderDetailsByReference, type OrderResultDetails } from "lib/actions/payments";

type ResultState =
  | { phase: "verifying" }
  | { phase: "success"; order: OrderResultDetails }
  | { phase: "failed"; message: string }
  | { phase: "pending"; message: string }
  | { phase: "error"; message: string };

function ResultContent() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? "";
  const [state, setState] = useState<ResultState>({ phase: "verifying" });

  useEffect(() => {
    if (!reference) {
      setState({
        phase: "error",
        message: "No payment reference found. Please return to checkout and try again.",
      });
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const result = await verifyPaymentAction(reference);

        if (cancelled) return;

        if (!result.ok) {
          setState({
            phase: "failed",
            message: result.error ?? "Payment could not be verified.",
          });
          return;
        }

        switch (result.status) {
          case "success":
          case "already_processed": {
            // Fetch order details for the tracking link
            const details = await getOrderDetailsByReference(reference);
            setState({
              phase: "success",
              order: details ?? {
                orderId: "",
                orderNumber: "",
                trackingToken: "",
              },
            });
            break;
          }
          case "pending":
            setState({
              phase: "pending",
              message:
                "Your payment is still being processed. This page will update automatically.",
            });
            // Retry after a few seconds for pending payments
            setTimeout(() => {
              if (!cancelled) verify();
            }, 5000);
            break;
          default:
            setState({
              phase: "failed",
              message: "Could not confirm your payment. Please contact support.",
            });
        }
      } catch {
        if (!cancelled) {
          setState({
            phase: "error",
            message: "Could not reach the payment service. Please contact support.",
          });
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="container mx-auto px-[var(--ds-space-4)] py-[var(--ds-space-8)] max-w-2xl">
      {state.phase === "verifying" ? (
        <SuccessSummary
          title="Verifying your payment…"
          description="Please wait while we confirm your payment with Paystack."
        />
      ) : state.phase === "success" ? (
        <SuccessSummary
          title="Payment successful!"
          description="Your order has been confirmed. We&apos;ll send you updates about your order status."
        >
          {state.order.orderNumber ? (
            <div className="mb-[var(--ds-space-4)] p-[var(--ds-space-3)] rounded-[var(--ds-radius-sm)] bg-[var(--ds-color-surface)] border border-[var(--ds-color-border)] text-left">
              <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                Order number
              </div>
              <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                {state.order.orderNumber}
              </div>
              {state.order.trackingToken ? (
                <>
                  <div className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    Track your order
                  </div>
                  <Link
                    href={`/track/${state.order.trackingToken}`}
                    className="text-[length:var(--ds-text-small)] text-[var(--ds-color-accent)] underline break-all"
                  >
                    /track/{state.order.trackingToken.slice(0, 8)}…
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Link href="/account/orders">
              <Button variant="primary">View your orders</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Continue shopping</Button>
            </Link>
          </div>
        </SuccessSummary>
      ) : state.phase === "pending" ? (
        <SuccessSummary
          title="Payment pending…"
          description={state.message}
        >
          <Link href="/checkout">
            <Button variant="outline">Return to checkout</Button>
          </Link>
        </SuccessSummary>
      ) : state.phase === "failed" ? (
        <SuccessSummary
          title="Payment not completed"
          description={state.message}
        >
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Link href="/checkout">
              <Button variant="primary">Try again</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Continue shopping</Button>
            </Link>
          </div>
        </SuccessSummary>
      ) : (
        <SuccessSummary
          title="Payment verification error"
          description={state.message}
        >
          <div className="flex flex-wrap gap-[var(--ds-space-3)]">
            <Link href="/checkout">
              <Button variant="primary">Return to checkout</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Continue shopping</Button>
            </Link>
          </div>
        </SuccessSummary>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-[var(--ds-space-4)] py-[var(--ds-space-8)] max-w-2xl">
          <SuccessSummary
            title="Verifying your payment…"
            description="Please wait while we confirm your payment with Paystack."
          />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
