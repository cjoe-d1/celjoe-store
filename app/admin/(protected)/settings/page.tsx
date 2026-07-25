import { buildMetadata } from "lib/seo";
import { AdminPageContainer, AdminTopBar } from "components/chds/admin";
import { Card, Label, Button, Field, TextInput } from "components/chds";
import { getCurrentSession } from "lib/auth/session";
import { requirePermission } from "lib/auth/guards";
import { siteConfig } from "lib/site-config";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Settings",
  description: "Business, security, and integrations.",
  path: "/admin/settings",
  noIndex: true,
});

export default async function AdminSettingsPage() {
  const session = await getCurrentSession();
  if (!session) return null;
  requirePermission(session, "settings:read");

  return (
    <>
      <AdminTopBar
        title="Settings"
        description="Business information, branding, payment, delivery, and security."
      />
      <AdminPageContainer>
        <div className="grid grid-cols-1 gap-[var(--ds-space-4)] lg:grid-cols-2">
          <Card variant="dashboard">
            <Label tone="muted">Business information</Label>
            <div className="mt-[var(--ds-space-3)] flex flex-col gap-[var(--ds-space-3)]">
              <Field label="Brand name">
                <TextInput defaultValue={siteConfig.name} readOnly />
              </Field>
              <Field label="Company name">
                <TextInput defaultValue={siteConfig.company} readOnly />
              </Field>
              <Field label="Tagline">
                <TextInput defaultValue={siteConfig.tagline} readOnly />
              </Field>
            </div>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Payment methods</Label>
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              Configure your gateway credentials, accepted currencies, and refund policy.
            </p>
            <div className="mt-[var(--ds-space-3)] flex gap-[var(--ds-space-2)]">
              <Button variant="outline" size="sm" disabled>
                Connect Stripe
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Manage currencies
              </Button>
            </div>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Delivery</Label>
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              Set delivery zones, fees, and minimum order values. Hooks in place for
              providers such as Pathao, Gokada, and your in-house riders.
            </p>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Tax</Label>
            <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
              Apply VAT, service charges, and jurisdiction-specific rules.
            </p>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Notifications</Label>
            <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              <li>Order updates — Email + SMS foundation</li>
              <li>Customer service — WhatsApp hooks</li>
              <li>Marketing — Email automation ready</li>
            </ul>
          </Card>

          <Card variant="dashboard">
            <Label tone="muted">Security</Label>
            <ul className="mt-[var(--ds-space-2)] flex flex-col gap-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
              <li>Session: 8-hour rolling cookie</li>
              <li>Middleware protection on /admin</li>
              <li>Server-side permission guards</li>
              <li>Audit log: every state change</li>
            </ul>
          </Card>
        </div>
      </AdminPageContainer>
    </>
  );
}
