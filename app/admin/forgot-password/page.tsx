import { Field, EmailInput, Button } from "components/chds";
import LogoImage from "components/logo";
import { requestPasswordResetAction } from "lib/auth/actions";
import { buildMetadata } from "lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Reset password",
  description: "Reset your Celjoe staff password.",
  path: "/admin/forgot-password",
  noIndex: true,
});

type SearchParams = Promise<{ sent?: string }>;

export default async function AdminForgotPassword(props: {
  searchParams: SearchParams;
}) {
  const sp = await props.searchParams;
  if (sp.sent) {
    return (
      <CenteredCard>
        <LogoImage className="mx-auto h-8" />
        <h1 className="mt-[var(--ds-space-3)] text-center text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Check your email
        </h1>
        <p className="mt-[var(--ds-space-2)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          If an account exists for that email, a reset link is on its way.
        </p>
        <div className="mt-[var(--ds-space-6)] text-center">
          <a
            className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-accent)] hover:underline"
            href="/admin/login"
          >
            Back to sign in
          </a>
        </div>
      </CenteredCard>
    );
  }

  return (
    <CenteredCard>
      <LogoImage className="mx-auto h-8" />
      <h1 className="mt-[var(--ds-space-3)] text-center text-[length:var(--ds-text-h3)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
        Reset your password
      </h1>
      <p className="mt-[var(--ds-space-2)] text-center text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
        Enter the email tied to your staff account. We&apos;ll send a reset link.
      </p>
      <form
        action={requestPasswordResetAction}
        className="mt-[var(--ds-space-6)] flex flex-col gap-[var(--ds-space-4)]"
      >
        <Field label="Email">
          <EmailInput name="email" required autoComplete="email" />
        </Field>
        <Button type="submit" variant="primary">
          Send reset link
        </Button>
        <a
          className="text-center text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)] hover:underline"
          href="/admin/login"
        >
          Back to sign in
        </a>
      </form>
    </CenteredCard>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ds-color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-[var(--ds-space-4)] px-[var(--ds-space-6)] py-[var(--ds-space-12)]">
        {children}
      </div>
    </div>
  );
}
