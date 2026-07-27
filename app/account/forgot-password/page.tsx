import type { Metadata } from "next";

import { Button, Field, TextInput } from "components/chds";
import { buildMetadata } from "lib/seo";
import Link from "next/link";
import { customerForgotPasswordAction } from "lib/auth/actions";

export const metadata: Metadata = buildMetadata({
  title: "Forgot password",
  description: "Reset your Celjoe account password.",
  path: "/account/forgot-password",
});

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Please enter your email.",
  "service-unavailable":
    "The authentication service is temporarily unavailable.",
};

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function CustomerForgotPasswordPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const sent = sp.sent === "1";
  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] : null;

  return (
    <main className="min-h-screen bg-[var(--ds-color-bg)] py-[var(--ds-space-16)]">
      <div className="mx-auto w-full max-w-[440px] px-[var(--ds-space-6)]">
        <header className="mb-[var(--ds-space-8)] text-center">
          <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-fg)]">
            Forgot password
          </h1>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            We&rsquo;ll email you a link to reset your password.
          </p>
        </header>

        {sent ? (
          <div
            role="status"
            className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          >
            If that email is registered, a reset link is on its way.
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          >
            {errorMessage}
          </div>
        ) : null}

        <form
          action={customerForgotPasswordAction}
          className="flex flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]"
        >
          <Field label="Email">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>

        <p className="mt-[var(--ds-space-6)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          <Link
            href="/account/login"
            className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] underline-offset-2 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
