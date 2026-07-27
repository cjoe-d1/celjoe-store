import type { Metadata } from "next";

import { Button, Field, TextInput } from "components/chds";
import { buildMetadata } from "lib/seo";
import Link from "next/link";
import { customerRegisterAction } from "lib/auth/actions";

export const metadata: Metadata = buildMetadata({
  title: "Create an account",
  description: "Create your Celjoe account.",
  path: "/account/register",
});

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "All fields are required.",
  "weak-password":
    "Password must be at least 10 characters and include both letters and numbers.",
  "service-unavailable":
    "The authentication service is temporarily unavailable.",
};

type SearchParams = Promise<{ error?: string }>;

export default async function CustomerRegisterPage(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  const errorMessage = sp.error
    ? ERROR_MESSAGES[sp.error] ?? sp.error
    : null;

  const inputCls =
    "w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] outline-none focus:border-[var(--ds-color-accent)]";

  return (
    <main className="min-h-screen bg-[var(--ds-color-bg)] py-[var(--ds-space-16)]">
      <div className="mx-auto w-full max-w-[440px] px-[var(--ds-space-6)]">
        <header className="mb-[var(--ds-space-8)] text-center">
          <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-fg)]">
            Create your account
          </h1>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Track orders and save delivery addresses.
          </p>
        </header>

        {errorMessage ? (
          <div
            role="alert"
            className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          >
            {errorMessage}
          </div>
        ) : null}

        <form
          action={customerRegisterAction}
          className="flex flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]"
        >
          <div className="grid grid-cols-1 gap-[var(--ds-space-3)] sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                id="first_name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Last name">
              <TextInput
                id="last_name"
                name="last_name"
                type="text"
                autoComplete="family-name"
              />
            </Field>
          </div>
          <Field label="Email">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </Field>
          <Field
            label="Password"
            hint="At least 10 characters, with letters and numbers."
          >
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className={inputCls}
            />
          </Field>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-[var(--ds-space-6)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Already have an account?{" "}
          <Link
            href="/account/login"
            className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
