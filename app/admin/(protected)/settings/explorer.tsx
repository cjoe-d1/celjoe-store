"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Textarea, Button, Select, Checkbox } from "components/chds";
import {
  saveBusinessProfileAction,
  saveOpeningHoursAction,
  saveTaxesAction,
  saveDeliverySettingsAction,
  savePaymentSettingsAction,
  saveBrandingAction,
  saveNotificationsAction,
  saveSecuritySettingsAction,
  sendTestPushAction,
} from "lib/actions/settings";

type Initial = {
  business: Record<string, string>;
  hours: Record<string, { open: string; close: string; closed: boolean }>;
  taxes: { vatRate: number; serviceChargeRate: number; inclusive: boolean };
  delivery: {
    baseFee: number;
    perKmFee: number;
    freeDeliveryThreshold: number;
    minOrder: number;
    maxRadiusKm: number;
    zones: Array<{ name: string; fee: number }>;
  };
  payments: Record<string, unknown>;
  branding: Record<string, string>;
  notifications: Record<string, boolean>;
  security: Record<string, unknown>;
};

type Props = { initial: Initial };

const DAYS = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
] as const;

export function SettingsExplorer({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"business" | "hours" | "taxes" | "delivery" | "payments" | "branding" | "notifications" | "security">("business");

  const flash = (text: string, isError: boolean) => {
    if (isError) {
      setError(text);
      setFeedback(null);
    } else {
      setFeedback(text);
      setError(null);
    }
    startTransition(() => router.refresh());
  };

  const business = initial.business;
  const hours = initial.hours;
  const taxes = initial.taxes;
  const delivery = initial.delivery;
  const payments = initial.payments;
  const branding = initial.branding;
  const notifications = initial.notifications;
  const security = initial.security;

  const submitBusiness = (fd: FormData) =>
    startTransition(async () => {
      const r = await saveBusinessProfileAction(fd);
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitHours = () =>
    startTransition(async () => {
      const r = await saveOpeningHoursAction(hours);
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitTaxes = () =>
    startTransition(async () => {
      const r = await saveTaxesAction(taxes);
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitDelivery = () =>
    startTransition(async () => {
      const r = await saveDeliverySettingsAction(delivery);
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitPayments = () =>
    startTransition(async () => {
      const r = await savePaymentSettingsAction({
        acceptedMethods: ((payments.acceptedMethods as string[]) ?? []).filter(Boolean),
        paystackPublicKey: String(payments.paystackPublicKey ?? ""),
        defaultCurrency: String(payments.defaultCurrency ?? "NGN"),
      });
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitBranding = () =>
    startTransition(async () => {
      const r = await saveBrandingAction({
        logoUrl: String(branding.logoUrl ?? ""),
        faviconUrl: String(branding.faviconUrl ?? ""),
        primaryColor: String(branding.primaryColor ?? ""),
        accentColor: String(branding.accentColor ?? ""),
        fontHeading: String(branding.fontHeading ?? "Montserrat"),
        fontBody: String(branding.fontBody ?? "Inter"),
      });
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitNotifications = () =>
    startTransition(async () => {
      const r = await saveNotificationsAction({
        emailEnabled: Boolean(notifications.emailEnabled),
        smsEnabled: Boolean(notifications.smsEnabled),
        whatsappEnabled: Boolean(notifications.whatsappEnabled),
        orderConfirmation: Boolean(notifications.orderConfirmation),
        orderReady: Boolean(notifications.orderReady),
        orderDelivered: Boolean(notifications.orderDelivered),
        marketingEmail: Boolean(notifications.marketingEmail),
      });
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const submitSecurity = () =>
    startTransition(async () => {
      const r = await saveSecuritySettingsAction({
        sessionMaxHours: Number(security.sessionMaxHours ?? 8),
        requireMfa: Boolean(security.requireMfa),
        passwordMinLength: Number(security.passwordMinLength ?? 8),
        ipAllowlist: String(security.ipAllowlist ?? ""),
      });
      flash(r.ok ? "Saved." : r.error, !r.ok);
    });

  const testPush = () =>
    startTransition(async () => {
      const r = await sendTestPushAction();
      flash(r.ok ? "Test notification sent. Check your device." : r.error, !r.ok);
    });

  return (
    <div className="flex flex-col gap-[var(--ds-space-4)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-[var(--ds-space-2)]">
        {(["business", "hours", "taxes", "delivery", "payments", "branding", "notifications", "security"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "primary" : "ghost"} size="sm" onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === "business" ? (
        <form action={submitBusiness} className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Brand name"><TextInput name="brand_name" defaultValue={business.brand_name ?? ""} /></Field>
          <Field label="Company name"><TextInput name="company_name" defaultValue={business.company_name ?? ""} /></Field>
          <Field label="Tagline"><TextInput name="tagline" defaultValue={business.tagline ?? ""} /></Field>
          <Field label="Contact email"><TextInput name="contact_email" type="email" defaultValue={business.contact_email ?? ""} /></Field>
          <Field label="Contact phone"><TextInput name="contact_phone" defaultValue={business.contact_phone ?? ""} /></Field>
          <Field label="Address"><TextInput name="address" defaultValue={business.address ?? ""} /></Field>
          <Field label="City"><TextInput name="city" defaultValue={business.city ?? ""} /></Field>
          <Field label="State"><TextInput name="state" defaultValue={business.state ?? ""} /></Field>
          <Field label="Country"><TextInput name="country" defaultValue={business.country ?? "Nigeria"} /></Field>
          <Field label="Registration number"><TextInput name="registration_number" defaultValue={business.registration_number ?? ""} /></Field>
          <Field label="Tax ID"><TextInput name="tax_id" defaultValue={business.tax_id ?? ""} /></Field>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" disabled={pending}>Save</Button>
          </div>
        </form>
      ) : null}

      {tab === "hours" ? (
        <div className="flex flex-col gap-[var(--ds-space-3)]">
          {DAYS.map(([k, label]) => {
            const day = hours[k] ?? { open: "09:00", close: "22:00", closed: false };
            return (
              <div key={k} className="grid grid-cols-1 items-center gap-[var(--ds-space-3)] md:grid-cols-[120px_1fr_1fr_120px]">
                <span className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">{label}</span>
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => (hours[k] = { ...day, open: e.target.value })}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-fg)]"
                />
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => (hours[k] = { ...day, close: e.target.value })}
                  className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] px-[var(--ds-space-2)] py-[var(--ds-space-1)] text-[var(--ds-color-fg)]"
                />
                <Checkbox
                  name={`closed_${k}`}
                  checked={day.closed}
                  onChange={(e) => (hours[k] = { ...day, closed: e.target.checked })}
                  label="Closed"
                />
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button onClick={submitHours} variant="primary" disabled={pending}>
              Save hours
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "taxes" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-3">
          <Field label="VAT rate (%)">
            <TextInput
              type="number"
              step="0.1"
              min="0"
              value={taxes.vatRate}
              onChange={(e) => (taxes.vatRate = Number(e.target.value))}
            />
          </Field>
          <Field label="Service charge (%)">
            <TextInput
              type="number"
              step="0.1"
              min="0"
              value={taxes.serviceChargeRate}
              onChange={(e) => (taxes.serviceChargeRate = Number(e.target.value))}
            />
          </Field>
          <Field label="Tax mode">
            <Select value={String(taxes.inclusive)} onChange={(e) => (taxes.inclusive = e.target.value === "true")}>
              <option value="false">Exclusive (added on top)</option>
              <option value="true">Inclusive (already in price)</option>
            </Select>
          </Field>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={submitTaxes} variant="primary" disabled={pending}>
              Save taxes
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "delivery" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Base fee (₦)">
            <TextInput type="number" min="0" value={delivery.baseFee} onChange={(e) => (delivery.baseFee = Number(e.target.value))} />
          </Field>
          <Field label="Per-km fee (₦)">
            <TextInput type="number" min="0" value={delivery.perKmFee} onChange={(e) => (delivery.perKmFee = Number(e.target.value))} />
          </Field>
          <Field label="Free delivery threshold (₦)">
            <TextInput type="number" min="0" value={delivery.freeDeliveryThreshold} onChange={(e) => (delivery.freeDeliveryThreshold = Number(e.target.value))} />
          </Field>
          <Field label="Minimum order (₦)">
            <TextInput type="number" min="0" value={delivery.minOrder} onChange={(e) => (delivery.minOrder = Number(e.target.value))} />
          </Field>
          <Field label="Max radius (km)">
            <TextInput type="number" min="0" value={delivery.maxRadiusKm} onChange={(e) => (delivery.maxRadiusKm = Number(e.target.value))} />
          </Field>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={submitDelivery} variant="primary" disabled={pending}>
              Save delivery
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Default currency">
            <TextInput
              value={String(payments.defaultCurrency ?? "NGN")}
              onChange={(e) => (payments.defaultCurrency = e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-[var(--ds-space-3)] md:col-span-2">
            {["card", "transfer", "cash", "wallet", "pos"].map((m) => (
              <Checkbox
                key={m}
                checked={((payments.acceptedMethods as string[]) ?? []).includes(m)}
                onChange={(e) => {
                  const set = new Set((payments.acceptedMethods as string[]) ?? []);
                  if (e.target.checked) set.add(m);
                  else set.delete(m);
                  payments.acceptedMethods = Array.from(set);
                }}
                label={m}
              />
            ))}
          </div>
          <Field label="Paystack public key"><TextInput value={String(payments.paystackPublicKey ?? "")} onChange={(e) => (payments.paystackPublicKey = e.target.value)} /></Field>
          <div className="md:col-span-2 text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            The Paystack secret key is configured via the <code>PAYSTACK_SECRET_KEY</code> environment variable on your deployment platform. It is never stored or displayed here.
          </div>
          <div className="md:col-span-2 text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
            Test that push notifications work on admin devices. Must have an active push subscription in the current browser/PWA.
          </div>
          <div className="md:col-span-2 flex justify-between gap-[var(--ds-space-4)]">
            <Button onClick={testPush} variant="outline" disabled={pending}>
              {pending ? "Sending…" : "Send Test Notification"}
            </Button>
            <Button onClick={submitPayments} variant="primary" disabled={pending}>
              Save payments
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "branding" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Logo URL"><TextInput value={branding.logoUrl ?? ""} onChange={(e) => (branding.logoUrl = e.target.value)} /></Field>
          <Field label="Favicon URL"><TextInput value={branding.faviconUrl ?? ""} onChange={(e) => (branding.faviconUrl = e.target.value)} /></Field>
          <Field label="Primary color"><TextInput value={branding.primaryColor ?? ""} onChange={(e) => (branding.primaryColor = e.target.value)} /></Field>
          <Field label="Accent color"><TextInput value={branding.accentColor ?? ""} onChange={(e) => (branding.accentColor = e.target.value)} /></Field>
          <Field label="Heading font"><TextInput value={branding.fontHeading ?? "Montserrat"} onChange={(e) => (branding.fontHeading = e.target.value)} /></Field>
          <Field label="Body font"><TextInput value={branding.fontBody ?? "Inter"} onChange={(e) => (branding.fontBody = e.target.value)} /></Field>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={submitBranding} variant="primary" disabled={pending}>
              Save branding
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="flex flex-col gap-[var(--ds-space-3)]">
          <Checkbox name="emailEnabled" checked={Boolean(notifications.emailEnabled)} onChange={(e) => (notifications.emailEnabled = e.target.checked)} label="Email channel" />
          <Checkbox name="smsEnabled" checked={Boolean(notifications.smsEnabled)} onChange={(e) => (notifications.smsEnabled = e.target.checked)} label="SMS channel" />
          <Checkbox name="whatsappEnabled" checked={Boolean(notifications.whatsappEnabled)} onChange={(e) => (notifications.whatsappEnabled = e.target.checked)} label="WhatsApp channel" />
          <Checkbox name="orderConfirmation" checked={Boolean(notifications.orderConfirmation)} onChange={(e) => (notifications.orderConfirmation = e.target.checked)} label="Send order confirmation" />
          <Checkbox name="orderReady" checked={Boolean(notifications.orderReady)} onChange={(e) => (notifications.orderReady = e.target.checked)} label="Send order ready notification" />
          <Checkbox name="orderDelivered" checked={Boolean(notifications.orderDelivered)} onChange={(e) => (notifications.orderDelivered = e.target.checked)} label="Send order delivered notification" />
          <Checkbox name="marketingEmail" checked={Boolean(notifications.marketingEmail)} onChange={(e) => (notifications.marketingEmail = e.target.checked)} label="Marketing emails" />
          <div className="flex justify-end">
            <Button onClick={submitNotifications} variant="primary" disabled={pending}>
              Save notifications
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "security" ? (
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Session max hours">
            <TextInput
              type="number"
              min="1"
              value={Number(security.sessionMaxHours ?? 8)}
              onChange={(e) => (security.sessionMaxHours = Number(e.target.value))}
            />
          </Field>
          <Field label="Password min length">
            <TextInput
              type="number"
              min="6"
              value={Number(security.passwordMinLength ?? 8)}
              onChange={(e) => (security.passwordMinLength = Number(e.target.value))}
            />
          </Field>
          <Field label="IP allowlist (comma-separated)">
            <TextInput
              value={String(security.ipAllowlist ?? "")}
              onChange={(e) => (security.ipAllowlist = e.target.value)}
            />
          </Field>
          <Checkbox
            name="requireMfa"
            checked={Boolean(security.requireMfa)}
            onChange={(e) => (security.requireMfa = e.target.checked)}
            label="Require MFA for staff"
          />
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={submitSecurity} variant="primary" disabled={pending}>
              Save security
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
