"use client";

import { useState, useCallback } from "react";
import clsx from "clsx";
import { useCart } from "components/cart/cart-context";
import { Button, Field, TextInput } from "components/chds";
import {
  CheckoutProgress,
  CheckoutStepCard,
  OrderSummaryCard,
  type CheckoutStep,
} from "components/chds/checkout";
import { formatCurrency } from "lib/format-currency";
import { createOrderAction } from "lib/actions/checkout";

type DeliveryMethod = "standard" | "pickup";

const CHECKOUT_STEPS: CheckoutStep[] = [
  { id: "contact", label: "Contact", status: "current" },
  { id: "delivery", label: "Delivery", status: "upcoming" },
  { id: "payment", label: "Payment", status: "upcoming" },
];

export default function CheckoutPage() {
  const { cart } = useCart();
  const items = cart?.items ?? [];
  const subtotal = Number(cart?.cost?.subtotal?.amount ?? 0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = deliveryMethod === "pickup" ? 0 : 2500;
  const estimatedTotal = subtotal + deliveryFee;

  // Compute active step
  const steps: CheckoutStep[] = CHECKOUT_STEPS.map((s) => {
    if (s.id === "delivery" && firstName && lastName && email && phone) {
      return { ...s, status: "current" };
    }
    if (s.id === "payment" && firstName && lastName && email && phone) {
      return { ...s, status: "current" };
    }
    return s;
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (items.length === 0) {
        setError("Your cart is empty.");
        return;
      }
      if (!firstName || !lastName || !email || !phone) {
        setError("Please fill in all contact fields.");
        return;
      }

      setSubmitting(true);

      try {
        const fd = new FormData();
        fd.set("firstName", firstName);
        fd.set("lastName", lastName);
        fd.set("email", email);
        fd.set("phone", phone);
        fd.set("deliveryMethod", deliveryMethod);

        const result = await createOrderAction(fd);

        if (!result.ok) {
          setError(result.error);
          setSubmitting(false);
          return;
        }

        // Redirect to Paystack payment page
        window.location.href = result.authorizationUrl;
      } catch {
        setError("Something went wrong. Please try again.");
        setSubmitting(false);
      }
    },
    [firstName, lastName, email, phone, deliveryMethod, items.length],
  );

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-[var(--ds-space-4)] py-[var(--ds-space-8)] max-w-4xl">
        <CheckoutProgress steps={CHECKOUT_STEPS} />
        <div className="mt-[var(--ds-space-8)] text-center">
          <h2 className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            Your cart is empty
          </h2>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Add items to your cart before checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-[var(--ds-space-4)] py-[var(--ds-space-8)] max-w-4xl">
      <CheckoutProgress steps={steps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--ds-space-6)] mt-[var(--ds-space-6)]">
        {/* Left column: checkout form */}
        <form className="lg:col-span-2 flex flex-col gap-[var(--ds-space-4)]" onSubmit={handleSubmit}>
          {/* Contact */}
          <CheckoutStepCard title="1. Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--ds-space-3)]">
              <Field label="First name">
                <TextInput
                  name="firstName"
                  value={firstName}
                  onChange={(ev) => setFirstName(ev.target.value)}
                  placeholder="John"
                />
              </Field>
              <Field label="Last name">
                <TextInput
                  name="lastName"
                  value={lastName}
                  onChange={(ev) => setLastName(ev.target.value)}
                  placeholder="Doe"
                />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <TextInput
                  name="email"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  placeholder="john@example.com"
                />
              </Field>
              <Field label="Phone" className="sm:col-span-2">
                <TextInput
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(ev) => setPhone(ev.target.value)}
                  placeholder="08012345678"
                />
              </Field>
            </div>
          </CheckoutStepCard>

          {/* Delivery */}
          <CheckoutStepCard title="2. Delivery">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--ds-space-3)]">
              <label
                className={clsx(
                  "flex items-start gap-[var(--ds-space-3)] rounded-[var(--ds-radius-sm)] border p-[var(--ds-space-4)] cursor-pointer transition-colors",
                  deliveryMethod === "standard"
                    ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)]/5"
                    : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
                )}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="standard"
                  checked={deliveryMethod === "standard"}
                  onChange={() => setDeliveryMethod("standard")}
                  className="mt-1"
                />
                <div>
                  <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    Standard Delivery
                  </div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    Delivered within 45–90 minutes
                  </div>
                  <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-small)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {formatCurrency(2500)}
                  </div>
                </div>
              </label>

              <label
                className={clsx(
                  "flex items-start gap-[var(--ds-space-3)] rounded-[var(--ds-radius-sm)] border p-[var(--ds-space-4)] cursor-pointer transition-colors",
                  deliveryMethod === "pickup"
                    ? "border-[var(--ds-color-accent)] bg-[var(--ds-color-accent)]/5"
                    : "border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
                )}
              >
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  className="mt-1"
                />
                <div>
                  <div className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    Store Pickup
                  </div>
                  <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    Pick up from our location
                  </div>
                  <div className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-small)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-success)]">
                    Free
                  </div>
                </div>
              </label>
            </div>
          </CheckoutStepCard>

          {/* Payment */}
          <CheckoutStepCard title="3. Payment">
            <div className="flex flex-col gap-[var(--ds-space-3)]">
              {error ? (
                <div className="rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-error)] bg-[var(--ds-color-error-muted)] p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-error)]">
                  {error}
                </div>
              ) : null}

              <p className="text-[length:var(--ds-text-small)] text-[var(--ds-color-muted)]">
                You&apos;ll be redirected to Paystack to complete your payment
                securely. CELJOE never stores your card details.
              </p>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting
                  ? "Preparing your order…"
                  : `Pay ${formatCurrency(estimatedTotal)}`}
              </Button>
            </div>
          </CheckoutStepCard>
        </form>

        {/* Right column: order summary */}
        <aside>
          <OrderSummaryCard title="Order Summary">
            <div className="flex flex-col gap-[var(--ds-space-3)]">
              {items.map((item) => (
                <div key={item.id ?? item.variant?.id} className="flex justify-between gap-[var(--ds-space-2)]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] truncate">
                      {item.product?.name ?? "Product"}
                    </div>
                    <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      {item.variant?.name} &times; {item.quantity}
                    </div>
                  </div>
                  <div className="text-[length:var(--ds-text-small)] text-[var(--ds-color-fg)] shrink-0">
                    {formatCurrency(Number(item.totalPrice ?? 0))}
                  </div>
                </div>
              ))}

              <hr className="border-t border-[var(--ds-color-border)]" />

              <div className="flex justify-between text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                <span>Delivery</span>
                <span>{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</span>
              </div>
              <hr className="border-t border-[var(--ds-color-border)]" />
              <div className="flex justify-between text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                <span>Total</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>
          </OrderSummaryCard>
        </aside>
      </div>
    </div>
  );
}

