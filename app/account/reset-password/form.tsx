"use client";

import { Button, Field } from "components/chds";
import { useState, useTransition } from "react";
import { createBrowserClient } from "@supabase/ssr";

const inputCls =
  "w-full rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-3)] py-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)] outline-none focus:border-[var(--ds-color-accent)]";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must include both letters and numbers.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      );
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess(true);
      setPassword("");
      setConfirm("");
    });
  };

  if (success) {
    return (
      <div
        role="status"
        className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-4)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
      >
        Your password has been updated. You can now{" "}
        <a
          href="/account/login"
          className="font-[var(--ds-font-weight-medium)] underline-offset-2 hover:underline"
        >
          sign in
        </a>{" "}
        with your new password.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-[var(--ds-space-4)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)]"
    >
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
        >
          {error}
        </div>
      ) : null}
      <Field
        label="New password"
        hint="At least 10 characters, with letters and numbers."
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Confirm new password">
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
      >
        {isPending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
