import type { Metadata } from "next";

import { Checkbox, Field, FormSection } from "components/chds";
import { AccountShell } from "../_shell";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Choose what we tell you about.",
};

const NOTIFICATION_OPTIONS = [
  { id: "order_updates", label: "Order updates", defaultChecked: true, description: "Live status for active orders." },
  { id: "new_menu", label: "New menu drops", defaultChecked: true, description: "When new meals land in the kitchen." },
  { id: "smokehouse", label: "Smokehouse weekends", defaultChecked: false, description: "Platter drops and weekend specials." },
  { id: "catering", label: "Catering news", defaultChecked: false, description: "Event planning tips and seasonal menus." },
  { id: "promotions", label: "Occasional promos", defaultChecked: false, description: "We keep these rare and considered." },
];

export default function NotificationsPage() {
  return (
    <AccountShell
      current="/account/notifications"
      title="Notifications"
      description="Choose what we tell you about. We'll keep them quiet by default."
    >
      <form
        className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
        action="/api/account/notifications"
        method="post"
      >
        <FormSection title="Email">
          <ul className="flex flex-col gap-[var(--ds-space-3)]">
            {NOTIFICATION_OPTIONS.map((opt) => (
              <li
                key={opt.id}
                className="flex items-start gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]"
              >
                <Checkbox
                  id={opt.id}
                  name={opt.id}
                  defaultChecked={opt.defaultChecked}
                  className="mt-1"
                />
                <Field>
                  <label htmlFor={opt.id} className="text-[length:var(--ds-text-body)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {opt.label}
                  </label>
                  <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                    {opt.description}
                  </p>
                </Field>
              </li>
            ))}
          </ul>
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
