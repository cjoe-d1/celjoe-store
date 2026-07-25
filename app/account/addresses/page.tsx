import type { Metadata } from "next";

import { Button, Field, FormSection, TextInput } from "components/chds";
import { AccountShell } from "../_shell";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your delivery addresses.",
};

export default function AddressesPage() {
  return (
    <AccountShell
      current="/account/addresses"
      title="Addresses"
      description="Delivery addresses on file. Add one to speed up checkout."
    >
      <div className="rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
        <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          No saved addresses
        </h3>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Add your first delivery address. You can save multiple, label them,
          and pick a default for checkout.
        </p>
      </div>

      <form
        className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
        action="/api/account/addresses"
        method="post"
      >
        <FormSection
          title="Add an address"
          description="We only store what we need to deliver to you."
        >
          <Field label="Label">
            <TextInput name="label" placeholder="Home, Office, ..." />
          </Field>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="Street">
              <TextInput name="street" required />
            </Field>
            <Field label="City">
              <TextInput name="city" required />
            </Field>
            <Field label="State">
              <TextInput name="state" />
            </Field>
            <Field label="Postal code">
              <TextInput name="postal_code" />
            </Field>
          </div>
          <Field label="Delivery instructions" hint="Gate code, building, landmarks — anything that helps the rider.">
            <TextInput name="instructions" />
          </Field>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <Button type="submit">Save address</Button>
        </div>
      </form>
    </AccountShell>
  );
}
