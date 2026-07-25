import { Field, PasswordInput, Button } from "components/chds";
import { LogoIcon } from "components/icons";
import { buildMetadata } from "lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Set a new password",
  description: "Reset your Celjoe staff password.",
  path: "/admin/reset-password",
  noIndex: true,
});

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--ds-color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-[var(--ds-space-4)] px-[var(--ds-space-6)] py-[var(--ds-space-12)]">
        <LogoIcon className="mx-auto h-8 w-auto" />
        <h1 className="text-center text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] tracking-tight text-[var(--ds-color-fg)]">
          Set a new password
        </h1>
        <p className="text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Choose a strong password. After saving, sign in with your new credentials.
        </p>
        <form className="mt-[var(--ds-space-4)] flex flex-col gap-[var(--ds-space-4)]">
          <Field label="New password" hint="Minimum 10 characters with letters and numbers.">
            <PasswordInput name="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <PasswordInput name="confirm" required minLength={10} autoComplete="new-password" />
          </Field>
          <Button type="submit" variant="primary">
            Update password
          </Button>
        </form>
        <a
          className="text-center text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)] hover:underline"
          href="/admin/login"
        >
          Back to sign in
        </a>
      </div>
    </div>
  );
}
