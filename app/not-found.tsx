import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-[length:var(--ds-text-label)] font-[var(--ds-font-weight-medium)] uppercase tracking-[0.2em] text-[var(--ds-color-muted)]">
          404
        </p>
        <h1 className="mt-[var(--ds-space-4)] text-[length:var(--ds-text-h1)] font-[var(--ds-font-weight-medium)] tracking-tight text-[var(--ds-color-fg)]">
          Page not found
        </h1>
        <p className="mx-auto mt-[var(--ds-space-3)] max-w-md text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          The page you're looking for doesn't exist or has been moved. 
          Let us guide you back to something delicious.
        </p>
        <div className="mt-[var(--ds-space-8)] flex items-center justify-center gap-[var(--ds-space-4)]">
          <Link
            href="/"
            className="rounded-full bg-[var(--ds-color-accent)] px-[var(--ds-space-6)] py-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] font-[var(--ds-font-weight-medium)] text-white transition-opacity hover:opacity-90"
          >
            Return Home
          </Link>
          <Link
            href="/kitchen"
            className="rounded-full border border-[var(--ds-color-border)] px-[var(--ds-space-6)] py-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)] transition-colors hover:bg-[var(--ds-color-surface-muted)]"
          >
            Browse Kitchen
          </Link>
        </div>
      </div>
    </main>
  );
}
