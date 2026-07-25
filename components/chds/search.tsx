"use client";

import clsx from "clsx";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * CHDS Search Bar — hospitality-styled inline search input.
 * Submits to /search via Next's Form component.
 */
export function SearchBar({
  placeholder = "Search the kitchen...",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const searchParams = useSearchParams();

  return (
    <Form
      action="/search"
      className={clsx(
        "relative w-full max-w-[550px] lg:w-80 xl:w-full",
        className,
      )}
    >
      <input
        key={searchParams?.get("q")}
        type="text"
        name="q"
        placeholder={placeholder}
        autoComplete="off"
        defaultValue={searchParams?.get("q") || ""}
        className={clsx(
          "w-full rounded-full border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)]",
          "px-[var(--ds-space-5)] py-[var(--ds-space-3)] pr-[var(--ds-space-10)]",
          "text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]",
          "placeholder:text-[var(--ds-color-muted)]",
          "transition-[border-color,box-shadow] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-color-focus-ring)]",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ds-color-bg)]",
          "focus-visible:border-[var(--ds-color-accent)]",
        )}
      />
      <div className="pointer-events-none absolute right-[var(--ds-space-4)] top-0 flex h-full items-center text-[var(--ds-color-muted)]">
        <MagnifyingGlassIcon className="h-4 w-4" />
      </div>
    </Form>
  );
}

export function SearchBarSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "h-[44px] w-full max-w-[550px] animate-pulse rounded-full bg-[var(--ds-color-surface-muted)] lg:w-80 xl:w-full",
        className,
      )}
    />
  );
}
