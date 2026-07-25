"use client";

import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavbarChrome({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const [variant, setVariant] = useState<"solid" | "transparent">("solid");

  useEffect(() => {
    if (pathname !== "/") {
      setVariant("solid");
      return;
    }

    const hero = document.querySelector<HTMLElement>("[data-home-hero]");
    if (!hero) {
      setVariant("solid");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVariant(entry?.isIntersecting ? "transparent" : "solid");
      },
      { threshold: 0.1 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div
      data-navbar-variant={variant}
      className={clsx(
        "sticky top-0 z-[var(--ds-z-header)]",
        "transition-[background-color,border-color,backdrop-filter] duration-[var(--ds-duration-base)] ease-[var(--ds-ease-decelerate)]",
        variant === "transparent"
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--ds-color-border)] bg-[color:var(--ds-color-bg)]/90 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}

