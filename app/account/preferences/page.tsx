import type { Metadata } from "next";

import { AccountShell } from "../_shell";
import { getCurrentCustomerSession } from "lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Dietary notes and preferences.",
};

export default async function PreferencesPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/preferences");
  }

  return (
    <AccountShell
      current="/account/preferences"
      title="Preferences"
      description="Dietary notes and preferences. Your kitchen will use these to recommend and prepare."
    >
      <div className="rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-12)] text-center">
        <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Coming soon
        </h3>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Dietary preferences and allergen notes will be available soon.
        </p>
      </div>
    </AccountShell>
  );
}
