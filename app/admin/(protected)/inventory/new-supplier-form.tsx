"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Button, Card, Label, Textarea } from "components/chds";
import { createSupplierAction } from "lib/actions/inventory";

export function NewSupplierForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createSupplierAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <Card variant="dashboard">
      <Label tone="muted">Add supplier</Label>
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
          <Field label="Contact">
            <TextInput name="contact" />
          </Field>
          <Field label="Email">
            <TextInput name="email" type="email" />
          </Field>
          <Field label="Phone">
            <TextInput name="phone" />
          </Field>
        </div>
        <Field label="Address">
          <Textarea name="address" rows={2} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Add supplier"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
