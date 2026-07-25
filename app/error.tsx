"use client";

import { Button } from "components/chds";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-4 flex max-w-xl flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)] md:p-[var(--ds-space-12)]">
      <h2 className="text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        Something went wrong.
      </h2>
      <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
        There was an issue with our storefront. This could be temporary —
        please try your action again.
      </p>
      <Button onClick={() => reset()} className="w-full">
        Try Again
      </Button>
    </div>
  );
}
