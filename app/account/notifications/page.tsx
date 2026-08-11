import type { Metadata } from "next";

import { AccountShell } from "../_shell";
import { getCurrentCustomerSession } from "lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Choose what we tell you about.",
};

export default async function NotificationsPage() {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/notifications");
  }
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
