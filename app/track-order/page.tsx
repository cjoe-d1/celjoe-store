import type { Metadata } from "next";

import {
  Alert,
  Container,
  PageHeader,
} from "components/chds";
import Footer from "components/layout/footer";
import { buildMetadata } from "lib/seo";
import { TrackOrderForm } from "./track-order-form";
import { trackOrderAction } from "./actions";

export const metadata: Metadata = buildMetadata({
  title: "Track Order",
  description:
    "Track your Celjoe order from kitchen to your door. Enter your order number to see the live status.",
  path: "/track-order",
});

type SearchParams = {
  number?: string;
  notfound?: string;
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const sp = (await Promise.resolve(searchParams)) ?? {};
  const notFound = sp.notfound === "1";
  const lookedUpNumber = typeof sp.number === "string" ? sp.number : "";

  return (
    <>
      <PageHeader
        eyebrow="Track"
        title="Where is my order?"
        description="Enter your order number to see the live status — from the kitchen to your door."
      />

      <Container className="py-[var(--ds-space-12)]">
        <div className="grid grid-cols-1 gap-[var(--ds-space-10)] lg:grid-cols-2">
          <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
            <TrackOrderForm action={trackOrderAction} />
            {notFound ? (
              <div className="mt-[var(--ds-space-5)]">
                <Alert tone="warning" title="We couldn't find that order">
                  We didn&apos;t find a matching order for
                  {lookedUpNumber ? ` "${lookedUpNumber}"` : ""}. Double-check
                  the number, or contact us if you need help.
                </Alert>
              </div>
            ) : null}
          </div>
          <aside className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface-muted)] p-[var(--ds-space-8)]">
            <h2 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
              What to expect
            </h2>
            <ol className="mt-[var(--ds-space-4)] space-y-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">Order received</span> · We confirm your order immediately.</li>
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">Confirmed</span> · The kitchen accepts and starts prep.</li>
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">Preparing</span> · Our chefs are cooking with care.</li>
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">Ready</span> · Packed and waiting for the next step.</li>
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">On the way</span> · Out for delivery to your address.</li>
              <li><span className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">Delivered</span> · Enjoy your meal. Thank you for choosing Celjoe.</li>
            </ol>
            <p className="mt-[var(--ds-space-5)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              Need help? Reach us at{" "}
              <a className="underline" href="mailto:enwamara18@gmail.com">
                enwamara18@gmail.com
              </a>
              .
            </p>
          </aside>
        </div>
      </Container>

      <Footer />
    </>
  );
}
