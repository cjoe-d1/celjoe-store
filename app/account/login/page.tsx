import type { Metadata } from "next";

import { Button, Field, TextInput } from "components/chds";
import { buildMetadata } from "lib/seo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { customerSignInAction } from "lib/auth/actions";
import { getCurrentCustomerSession } from "lib/auth/session";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your CELJOE Grills & Juicebar account.",
  path: "/account/login",
});

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Email and password are required.",
  "invalid-credentials": "Those credentials don't match an account.",
  "email-not-confirmed":
    "Your email address hasn't been confirmed yet. Please check your inbox and click the verification link, then sign in.",
  "service-unavailable":
    "The authentication service is temporarily unavailable.",
  "rate-limited":
    "Too many login attempts. Please wait a minute before trying again.",
};

type SearchParams = Promise<{
  next?: string;
  error?: string;
  registered?: string;
  "check-email"?: string;
  email?: string;
}>;

export default async function CustomerLoginPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const session = await getCurrentCustomerSession();
  if (session) {
    redirect(sp.next || "/account");
  }
  const next = sp.next ?? "/account";
  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] ?? sp.error : null;
  const justRegistered = sp.registered === "1";
  const checkEmail = sp["check-email"] === "1";
  const emailDefault = sp.email ?? "";

  return (
    <main className="min-h-screen bg-[var(--ds-color-bg)] py-[var(--ds-space-16)]">
      <div className="mx-auto w-full max-w-[440px] px-[var(--ds-space-6)]">
        <header className="mb-[var(--ds-space-8)] text-center">
          <h1 className="text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] tracking-[var(--ds-letter-spacing-tight)] text-[var(--ds-color-fg)]">
            Welcome back
          </h1>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Sign in to your Celjoe account
          </p>
        </header>

        {justRegistered ? (
          <div
            role="status"
            className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          >
            Account created. Please sign in.
          </div>
        ) : null}

        {checkEmail ? (
          <div
            role="status"
            className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-accent)]/40 bg-[var(--ds-color-accent)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
          >
            Account created. Please check your email for a verification link before signing in.
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
          action={customerSignInAction}
          className="flex flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]"
        >
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={emailDefault}
            />
          </Field>
          <Field label="Password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] outline-none focus:border-[var(--ds-color-accent)]"
            />
          </Field>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
          <p className="text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            <Link
              href="/account/forgot-password"
              className="underline-offset-2 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </form>

        <p className="mt-[var(--ds-space-6)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          New to Celjoe?{" "}
          <Link
            href="/account/register"
            className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
