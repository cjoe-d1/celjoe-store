"use client";

import { useCart } from "components/cart/cart-context";
import {
  AddressCard,
  CheckoutProgress,
  DeliveryCard,
  OrderSummaryCard,
  PaymentCard,
} from "components/chds";
import { Button, TextInput, Checkbox, FormSection, Field } from "components/chds";
import { formatCurrency } from "lib/format-currency";

export default function CheckoutPage() {
  const { cart } = useCart();
  const items = cart?.items ?? [];
  const subtotal = Number(cart?.cost?.subtotal?.amount ?? "0");
  const deliveryFee = items.length > 0 ? 2500 : 0;
  const total = subtotal + deliveryFee;

  const steps = [
    { id: "address", label: "Address", status: "complete" as const },
    { id: "delivery", label: "Delivery", status: "current" as const },
    { id: "payment", label: "Payment", status: "upcoming" as const },
  ];

  return (
    <div className="mx-auto flex max-w-(--breakpoint-lg) flex-col gap-[var(--ds-space-8)] px-4 py-12">
      <CheckoutProgress steps={steps} />
      
      <div className="grid grid-cols-1 gap-[var(--ds-space-8)] lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-[var(--ds-space-6)]">
          <AddressCard title="Delivery Address" description="Where should we deliver your order?">
            <FormSection title="Contact Info">
              <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
                <Field label="First Name"><TextInput placeholder="First Name" /></Field>
                <Field label="Last Name"><TextInput placeholder="Last Name" /></Field>
              </div>
              <Field label="Email"><TextInput type="email" placeholder="Email Address" /></Field>
              <Field label="Phone"><TextInput type="tel" placeholder="Phone Number" /></Field>
            </FormSection>
            <div className="mt-4 flex justify-end">
              <Button>Continue to Delivery</Button>
            </div>
          </AddressCard>

          <DeliveryCard title="Delivery Options" description="Choose a delivery method.">
            <div className="flex flex-col gap-[var(--ds-space-3)]">
              <label className="flex items-center gap-[var(--ds-space-3)] rounded-lg border border-[var(--ds-color-border)] p-[var(--ds-space-4)]">
                <Checkbox defaultChecked />
                <div>
                  <div className="font-medium text-[var(--ds-color-fg)]">Standard Delivery</div>
                  <div className="text-sm text-[var(--ds-color-muted)]">30-45 minutes</div>
                </div>
                <div className="ml-auto font-medium text-[var(--ds-color-fg)]">{formatCurrency(deliveryFee)}</div>
              </label>
              <label className="flex items-center gap-[var(--ds-space-3)] rounded-lg border border-[var(--ds-color-border)] p-[var(--ds-space-4)]">
                <Checkbox />
                <div>
                  <div className="font-medium text-[var(--ds-color-fg)]">Store Pickup</div>
                  <div className="text-sm text-[var(--ds-color-muted)]">Ready in 20 minutes</div>
                </div>
                <div className="ml-auto font-medium text-[var(--ds-color-fg)]">Free</div>
              </label>
            </div>
          </DeliveryCard>

          <PaymentCard title="Payment" description="Secured by Paystack. All transactions in Nigerian Naira (₦).">
            <div className="flex flex-col gap-[var(--ds-space-4)]">
              <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/20 bg-[var(--ds-color-success)]/5 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                You&apos;ll be redirected to Paystack to complete your payment securely.
                CELJOE never stores your card details.
              </div>
              <Button className="w-full">
                Pay {formatCurrency(total)}
              </Button>
            </div>
          </PaymentCard>
        </div>

        <div>
          <OrderSummaryCard>
            <div className="flex flex-col gap-[var(--ds-space-3)] text-sm text-[var(--ds-color-muted)]">
              {/* Line items */}
              {items.map((item) => (
                <div key={item.id ?? item.variant?.id} className="flex items-center justify-between border-b border-[var(--ds-color-border)] pb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-[var(--ds-color-fg)]">{item.product.name}</p>
                    <p className="text-[length:var(--ds-text-caption)]">
                      Qty: {item.quantity}
                      {item.variant?.name && item.variant.name !== "Default" && ` · ${item.variant.name}`}
                    </p>
                  </div>
                  <span className="text-[var(--ds-color-fg)] shrink-0">
                    {formatCurrency(item.totalPrice.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-b border-[var(--ds-color-border)] pb-2">
                <p>Subtotal</p>
                <span className="text-[var(--ds-color-fg)]">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--ds-color-border)] pb-2">
                <p>Delivery</p>
                <span className="text-[var(--ds-color-fg)]">{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 font-medium text-[length:var(--ds-text-h4)] text-[var(--ds-color-fg)]">
                <p>Total</p>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
