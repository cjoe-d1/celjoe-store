import {
  AddressCard,
  CheckoutProgress,
  DeliveryCard,
  OrderSummaryCard,
  PaymentCard,
} from "components/chds";
import { Button, TextInput, Select, Checkbox, FormSection, Field } from "components/chds";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
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
                <div className="ml-auto font-medium text-[var(--ds-color-fg)]">₦2,500</div>
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

          <PaymentCard title="Payment" description="Select a payment method.">
            <div className="flex flex-col gap-[var(--ds-space-4)]">
              <Select>
                <option>Paystack</option>
                <option>Bank Transfer</option>
                <option>Cash on Delivery</option>
              </Select>
              <Button className="w-full">Place Order</Button>
            </div>
          </PaymentCard>
        </div>

        <div>
          <OrderSummaryCard>
            <div className="flex flex-col gap-[var(--ds-space-3)] text-sm text-[var(--ds-color-muted)]">
              <div className="flex items-center justify-between border-b border-[var(--ds-color-border)] pb-2">
                <p>Subtotal</p>
                <span className="text-[var(--ds-color-fg)]">₦0.00</span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--ds-color-border)] pb-2">
                <p>Delivery</p>
                <span className="text-[var(--ds-color-fg)]">₦2,500.00</span>
              </div>
              <div className="flex items-center justify-between pt-2 font-medium text-[length:var(--ds-text-h4)] text-[var(--ds-color-fg)]">
                <p>Total</p>
                <span>₦2,500.00</span>
              </div>
            </div>
          </OrderSummaryCard>
        </div>
      </div>
    </div>
  );
}
