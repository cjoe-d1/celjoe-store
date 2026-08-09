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
      <div className="rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-12)] text-center">
        <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Coming soon
        </h3>
        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Notification preferences will be available soon. For now, we&apos;ll keep you updated on your orders.
        </p>
      </div>
    </AccountShell>
  );
}
