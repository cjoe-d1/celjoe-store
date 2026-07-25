import clsx from "clsx";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-(--breakpoint-2xl) px-4", className)}>
      {children}
    </div>
  );
}

