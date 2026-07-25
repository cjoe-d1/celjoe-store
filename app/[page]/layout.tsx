import type { ReactNode } from "react";

import Footer from "components/layout/footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="flex flex-col gap-[var(--ds-space-8)]">
        {children}
      </main>
      <Footer />
    </>
  );
}
