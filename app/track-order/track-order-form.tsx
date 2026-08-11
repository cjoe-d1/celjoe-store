"use client";

import { useFormStatus } from "react-dom";
import {
  Button,
  Field,
  FormSection,
  TextInput,
} from "components/chds";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Looking up your order..." : "Track my order"}
    </Button>
  );
}

export function TrackOrderForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      className="flex flex-col gap-[var(--ds-space-5)]"
      action={action}
    >
      <FormSection
        title="Track your order"
        description="Enter your order number (e.g. CJ-XXXX-XXXX) or the tracking code from your confirmation."
      >
        <Field label="Order number or tracking code">
          <TextInput
            name="orderNumber"
            placeholder="CJ-XXXX-XXXX or tracking code"
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
      <SubmitButton />
    </form>
  );
}
