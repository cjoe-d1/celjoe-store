import type { Metadata } from "next";

import { Button, Field, FormSection, TextInput } from "components/chds";
import { AccountShell } from "../_shell";
import {
  customerChangePasswordAction,
  customerUpdateProfileAction,
} from "lib/auth/actions";
import { getCurrentCustomerSession } from "lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Profile, email, and password.",
};

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "All fields are required.",
  "weak-password":
    "Password must be at least 10 characters and include both letters and numbers.",
  "password-mismatch": "New password and confirmation do not match.",
  "invalid-current-password": "Current password is incorrect.",
  "service-unavailable":
    "The authentication service is temporarily unavailable.",
};

type SearchParams = Promise<{
  error?: string;
  "password-changed"?: string;
  "profile-updated"?: string;
}>;

const inputCls =
  "w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] outline-none focus:border-[var(--ds-color-accent)] disabled:cursor-not-allowed disabled:opacity-60";

export default async function SettingsPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/settings");
  }
  const errorMessage = sp.error
    ? ERROR_MESSAGES[sp.error] ?? sp.error
    : null;
  const passwordChanged = sp["password-changed"] === "1";
  const profileUpdated = sp["profile-updated"] === "1";

  const [firstName, ...rest] = (session.fullName ?? "").split(" ");
  const lastName = rest.join(" ");

  return (
    <AccountShell
      current="/account/settings"
      title="Account Settings"
      description="Profile, email, and password."
    >
      {errorMessage ? (
        <div
          role="alert"
          className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
        >
          {errorMessage}
        </div>
      ) : null}

      {passwordChanged ? (
        <div
          role="status"
          className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
        >
          Your password has been updated.
        </div>
      ) : null}

      <form
        action={customerUpdateProfileAction}
        className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
      >
        <FormSection title="Profile" description="How we greet you.">
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                id="first_name"
                name="first_name"
                autoComplete="given-name"
                defaultValue={firstName ?? ""}
                required
              />
            </Field>
            <Field label="Last name">
              <TextInput
                id="last_name"
                name="last_name"
                autoComplete="family-name"
                defaultValue={lastName ?? ""}
              />
            </Field>
            <Field label="Email">
              <input
                id="email"
                name="email_disabled"
                type="email"
                autoComplete="email"
                defaultValue={session.email}
                disabled
                className={inputCls}
              />
            </Field>
            <Field label="Phone">
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className={inputCls}
              />
            </Field>
          </div>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <Button type="submit">
            {profileUpdated ? "Saved!" : "Save profile"}
          </Button>
        </div>
      </form>

      <form
        action={customerChangePasswordAction}
        className="mt-[var(--ds-space-6)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
      >
        <FormSection
          title="Password"
          description="Change your password. You will be signed out everywhere else."
        >
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="Current password">
              <input
                id="current_password"
                name="current_password"
                type="password"
                autoComplete="current-password"
                required
                className={inputCls}
              />
            </Field>
            <div className="hidden sm:block" />
            <Field
              label="New password"
              hint="At least 10 characters, with letters and numbers."
            >
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </Field>
            <Field label="Confirm new password">
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                className={inputCls}
              />
            </Field>
          </div>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <Button type="submit">Change password</Button>
        </div>
      </form>
    </AccountShell>
  );
}
