"use client";

import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Field,
  FormSection,
  TextInput,
} from "components/chds";

export function TrackOrderForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Unable to track this order.",
        );
      }
    });
  };

  return (
    <form
      className="flex flex-col gap-[var(--ds-space-5)]"
      action={handleSubmit}
    >
      <FormSection
        title="Order number"
        description="The number is on your receipt and confirmation email. It begins with CJ-."
      >
        <Field label="Order number">
          <TextInput
            name="orderNumber"
            placeholder="CJ-XXXX-XXXX"
            required
            autoComplete="off"
            inputMode="text"
          />
        </Field>
        <Field
          label="Email (optional)"
          hint="Help us find your order faster."
        >
          <TextInput
            name="email"
            type="email"
            autoComplete="email"
          />
        </Field>
      </FormSection>
      {error ? <Alert tone="danger" title="Unable to track">{error}</Alert> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Looking up your order..." : "Track my order"}
      </Button>
    </form>
  );
}
