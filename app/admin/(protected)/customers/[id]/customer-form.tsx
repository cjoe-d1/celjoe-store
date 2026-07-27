"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Textarea, Button, Select, Checkbox } from "components/chds";
import { updateCustomerAction } from "lib/actions/customers";
import type { CustomerDetail } from "lib/supabase/admin/settings";

type Props = { customer: CustomerDetail };

export function CustomerForm({ customer }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await updateCustomerAction(customer.id, formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <form action={submit} className="flex flex-col gap-[var(--ds-space-4)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
        <Field label="Full name">
          <TextInput name="full_name" defaultValue={customer.fullName} required />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" defaultValue={customer.phone ?? ""} />
        </Field>
        <Field label="Loyalty tier">
          <Select name="loyalty_tier" defaultValue={customer.loyaltyTier}>
            <option value="regular">Regular</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </Select>
        </Field>
        <Field label="Tags (comma-separated)">
          <TextInput name="tags" defaultValue={customer.tags.join(", ")} />
        </Field>
        <Field label="Diet (comma-separated)">
          <TextInput name="diet" defaultValue={customer.diet.join(", ")} placeholder="vegetarian, halal" />
        </Field>
        <Field label="Allergens (comma-separated)">
          <TextInput name="allergens" defaultValue={customer.allergens.join(", ")} placeholder="nuts, shellfish" />
        </Field>
      </div>

      <Field label="Internal notes">
        <Textarea name="internal_notes" defaultValue={customer.internalNotes ?? ""} rows={3} />
      </Field>

      <div className="flex flex-wrap gap-[var(--ds-space-4)]">
        <Checkbox name="is_vip" defaultChecked={customer.isVip} label="VIP" />
        <Checkbox name="is_blacklisted" defaultChecked={customer.isBlacklisted} label="Blacklisted" />
        <Checkbox name="marketing_consent" defaultChecked={customer.marketingConsent} label="Marketing consent" />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save customer"}
        </Button>
      </div>
    </form>
  );
}
