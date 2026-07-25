import { redirect } from "next/navigation";
import { LogoIcon } from "components/icons";
import { signInAction } from "lib/auth/actions";
import { getCurrentSession } from "lib/auth/session";
import { Button, Field, PasswordInput, TextInput } from "components/chds";
import { buildMetadata } from "lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Operations sign in",
  description: "Celjoe Hospitality Operations Centre.",
  path: "/admin/login",
  noIndex: true,
});

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "Email and password are required.",
  "invalid-credentials": "Those credentials don't match a staff account.",
  "not-staff":
    "This portal is for Celjoe staff only. Use the customer sign in.",
  "service-unavailable":
    "The authentication service is temporarily unavailable.",
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function AdminLoginPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const session = await getCurrentSession();
  if (session) {
    redirect(sp.next || "/admin");
  }
  const next = sp.next ?? "/admin";
  const errorMessage = sp.error ? ERROR_MESSAGES[sp.error] : null;

  return (
    <div className="min-h-screen bg-[var(--ds-color-bg)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-[var(--ds-space-8)] px-[var(--ds-space-6)] py-[var(--ds-space-12)]">
        <div className="flex flex-col items-center gap-[var(--ds-space-3)] text-center">
          <LogoIcon className="h-8 w-auto" />
          <div className="text-[length:var(--ds-text-label)] uppercase tracking-[0.18em] text-[var(--ds-color-muted)]">
            Hospitality Operations Centre
          </div>
          <h1 className="text-[length:var(--ds-text-h2)] font-[var(--ds-font-weight-medium)] tracking-tight text-[var(--ds-color-fg)]">
            Sign in
          </h1>
          <p className="max-w-sm text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Use your staff credentials. This portal is for Celjoe team members only.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 px-[var(--ds-space-4)] py-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]"
          >
            {errorMessage}
          </div>
        ) : null}

        <form action={signInAction} className="flex flex-col gap-[var(--ds-space-4)]">
          <input type="hidden" name="next" value={next} />
          <Field label="Email">
            <TextInput
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@celjoe.store"
            />
          </Field>
          <Field label="Password">
            <PasswordInput name="password" required autoComplete="current-password" />
          </Field>
          <Button type="submit" variant="primary">
            Sign in
          </Button>
        </form>

        <div className="text-center text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          <a className="underline-offset-4 hover:underline" href="/admin/forgot-password">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}
