import clsx from "clsx";

export function Prose({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "prose prose-neutral dark:prose-invert max-w-none text-[length:var(--ds-text-body)] leading-[var(--ds-leading-body)]",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}