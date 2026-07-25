import type { Metadata } from "next";

import { Field, FormSection, Textarea } from "components/chds";
import { AccountShell } from "../_shell";

export const metadata: Metadata = {
  title: "Preferences",
  description: "Dietary notes and preferences.",
};

const DIET_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "halal", label: "Halal" },
  { id: "gluten_free", label: "Gluten free" },
  { id: "nut_free", label: "Nut free" },
  { id: "dairy_free", label: "Dairy free" },
];

export default function PreferencesPage() {
  return (
    <AccountShell
      current="/account/preferences"
      title="Preferences"
      description="Dietary notes and preferences. Your kitchen will use these to recommend and prepare."
    >
      <form
        className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
        action="/api/account/preferences"
        method="post"
      >
        <FormSection title="Dietary notes" description="Pick what applies to you.">
          <ul className="grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2">
            {DIET_OPTIONS.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]"
              >
                <label htmlFor={opt.id} className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  {opt.label}
                </label>
                <input
                  id={opt.id}
                  name={opt.id}
                  type="checkbox"
                  className="h-4 w-4 rounded border border-[var(--ds-color-border)] text-[var(--ds-color-accent)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
                />
              </li>
            ))}
          </ul>
        </FormSection>
        <FormSection title="Allergens" description="Anything we should know about.">
          <Field label="Allergens & notes">
            <Textarea name="allergens" rows={4} placeholder="e.g. shellfish, peanut, ..." />
          </Field>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <button
            type="submit"
            className="inline-flex h-[var(--ds-size-control)] items-center justify-center rounded-full bg-[var(--ds-color-accent)] px-[var(--ds-space-6)] text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-white transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]"
          >
            Save preferences
          </button>
        </div>
      </form>
    </AccountShell>
  );
}
