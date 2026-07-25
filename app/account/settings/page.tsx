import type { Metadata } from "next";

import { Button, Field, FormSection, TextInput } from "components/chds";
import { AccountShell } from "../_shell";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Profile, email, and password.",
};

export default function SettingsPage() {
  return (
    <AccountShell
      current="/account/settings"
      title="Account Settings"
      description="Profile, email, and password."
    >
      <form
        className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
        action="/api/account/settings"
        method="post"
      >
        <FormSection title="Profile" description="How we greet you.">
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="First name">
              <TextInput name="first_name" autoComplete="given-name" />
            </Field>
            <Field label="Last name">
              <TextInput name="last_name" autoComplete="family-name" />
            </Field>
            <Field label="Email">
              <TextInput name="email" type="email" autoComplete="email" />
            </Field>
            <Field label="Phone">
              <TextInput name="phone" type="tel" autoComplete="tel" />
            </Field>
          </div>
        </FormSection>
        <FormSection title="Password" description="Change your password. Leave blank to keep the current one.">
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="New password">
              <TextInput name="password" type="password" autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <TextInput name="password_confirm" type="password" autoComplete="new-password" />
            </Field>
          </div>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </AccountShell>
  );
}
