import clsx from "clsx";
import type { HTMLAttributes } from "react";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
};

export function Container({ children, className, ...rest }: ContainerProps) {
  return (
    <div
      className={clsx(
        "mx-auto w-full max-w-[var(--ds-container-max)] px-[var(--ds-space-4)]",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("py-[var(--ds-space-8)]", className)}>{children}</section>
  );
}

export function Stack({
  children,
  gap = "4",
  className,
}: {
  children: React.ReactNode;
  gap?: "1" | "2" | "3" | "4" | "5" | "6" | "8" | "10" | "12" | "16";
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col", `gap-[var(--ds-space-${gap})]`, className)}>
      {children}
    </div>
  );
}

export function Cluster({
  children,
  gap = "3",
  align = "center",
  justify = "start",
  wrap = true,
  className,
}: {
  children: React.ReactNode;
  gap?: "1" | "2" | "3" | "4" | "5" | "6" | "8";
  align?: "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
  className?: string;
}) {
  const justifyClass =
    justify === "between"
      ? "justify-between"
      : justify === "center"
        ? "justify-center"
        : justify === "end"
          ? "justify-end"
          : "justify-start";

  const alignClass =
    align === "start"
      ? "items-start"
      : align === "end"
        ? "items-end"
        : align === "baseline"
          ? "items-baseline"
          : "items-center";

  return (
    <div
      className={clsx(
        "flex",
        wrap ? "flex-wrap" : "flex-nowrap",
        justifyClass,
        alignClass,
        `gap-[var(--ds-space-${gap})]`,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Grid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={clsx("grid gap-[var(--ds-space-4)]", className)}>{children}</div>;
}

export function SplitLayout({
  left,
  right,
  className,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("grid grid-cols-1 gap-[var(--ds-space-6)] lg:grid-cols-2", className)}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

export function SidebarLayout({
  sidebar,
  content,
  className,
}: {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("grid grid-cols-1 gap-[var(--ds-space-6)] lg:grid-cols-[320px_1fr]", className)}>
      <aside>{sidebar}</aside>
      <div>{content}</div>
    </div>
  );
}

export function ContentWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-6)] shadow-[var(--ds-shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

