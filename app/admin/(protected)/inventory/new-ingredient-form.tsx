"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Button, Card, Label, Select } from "components/chds";
import { createIngredientAction } from "lib/actions/inventory";

export function NewIngredientForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createIngredientAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card variant="dashboard">
      <Label tone="muted">Add ingredient</Label>
      <form action={submit} className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-3)]">
        {error ? (
          <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
            {error}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Name">
            <TextInput name="name" required />
          </Field>
          <Field label="Unit">
            <Select name="unit" defaultValue="kg">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="litre">litre</option>
              <option value="ml">ml</option>
              <option value="unit">unit</option>
              <option value="pack">pack</option>
            </Select>
          </Field>
          <Field label="Initial stock">
            <TextInput name="stock" type="number" min="0" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Low-stock threshold">
            <TextInput name="low_stock_threshold" type="number" min="0" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Cost per unit (₦)">
            <TextInput name="cost_per_unit" type="number" min="0" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Supplier">
            <TextInput name="supplier" />
          </Field>
          <Field label="Expiry (optional)">
            <TextInput name="expiry" type="date" />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Add ingredient"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
