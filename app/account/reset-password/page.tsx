import type { Metadata } from "next";

import { buildMetadata } from "lib/seo";
import { ResetPasswordForm } from "./form";

export const metadata: Metadata = buildMetadata({
  title: "Reset your password",
  description: "Set a new password for your Celjoe account.",
  path: "/account/reset-password",
});

export const dynamic = "force-dynamic";

export default function CustomerResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[var(--ds-color-bg)] py-[var(--ds-space-16)]">
      <div className="mx-auto w-full max-w-[440px] px-[var(--ds-space-6)]">
        <header className="mb-[var(--ds-space-8)] text-center">
          <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-fg)]">
            Set a new password
          </h1>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Enter a new password for your account.
          </p>
        </header>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
