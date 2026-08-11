"use client";

import { useActionState } from "react";
import {
  Button,
  Field,
  FormSection,
  Textarea,
  TextInput,
} from "components/chds";
import { submitQuotationAction } from "lib/actions/quotations";
import { buildCustomerQuotationWaText, waChatUrl } from "lib/services/whatsapp";
import { siteConfig } from "lib/site-config";

const BUSINESS_WHATSAPP = siteConfig.contact.whatsapp;

export function QuotationForm() {
  const [state, formAction, isPending] = useActionState(
    submitQuotationAction,
    null,
  );

  const isSuccess = state?.ok === true;
  const errorMessage = state?.ok === false ? state.error : null;
  const quoteNumber = state?.ok === true ? state.quoteNumber : null;

  if (isSuccess && quoteNumber && state.data) {
    const waText = buildCustomerQuotationWaText({
      customer_name: state.data.customer_name,
      customer_phone: state.data.customer_phone,
      customer_email: state.data.customer_email,
      quote_number: quoteNumber,
      event_type: state.data.event_type ?? null,
      guest_count: state.data.guest_count ?? null,
      event_date: state.data.event_date ?? null,
      notes: state.data.notes ?? null,
    });

    return (
      <div className="rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-10)] text-center md:p-[var(--ds-space-16)]">
        <div className="mb-[var(--ds-space-4)] inline-flex h-[var(--ds-space-16)] w-[var(--ds-space-16)] items-center justify-center rounded-full bg-[var(--ds-color-success)]/10">
          <svg
            className="h-[var(--ds-space-8)] w-[var(--ds-space-8)] text-[var(--ds-color-success)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-[length:var(--ds-text-h3)] text-[var(--ds-color-fg)]">
          Thank you for your enquiry.
        </h2>

        <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
          Your quotation <strong>{quoteNumber}</strong> has been received. We will review it and get back to you within 24 hours.
        </p>

        {BUSINESS_WHATSAPP ? (
          <div className="mt-[var(--ds-space-6)]">
            <p className="mb-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
              For a faster response, send us the details on WhatsApp.
            </p>
            <Button asChild>
              <a
                href={waChatUrl(BUSINESS_WHATSAPP, waText)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continue on WhatsApp
              </a>
            </Button>
          </div>
        ) : null}

        <div className="mt-[var(--ds-space-6)] flex flex-wrap justify-center gap-[var(--ds-space-3)]">
          <Button variant={BUSINESS_WHATSAPP ? "outline" : "primary"} asChild>
            <a href="/kitchen">Browse the kitchen</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/bbq">The Smokehouse</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-[var(--ds-space-8)] grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2"
    >
      <FormSection title="Your details">
        <Field label="Full name">
          <TextInput name="name" required autoComplete="name" />
        </Field>
        <Field label="Email">
          <TextInput name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" type="tel" required autoComplete="tel" />
        </Field>
      </FormSection>
      <FormSection title="Event">
        <Field label="Event type">
          <TextInput name="event_type" placeholder="Wedding, Corporate, ..." />
        </Field>
        <Field label="Guest count">
          <TextInput
            name="guests"
            type="number"
            min={1}
            inputMode="numeric"
          />
        </Field>
        <Field label="Date (approx.)">
          <TextInput name="event_date" type="date" />
        </Field>
      </FormSection>
      <div className="sm:col-span-2">
        <Field
          label="Notes"
          hint="Tell us about the room, the occasion, and any must-haves."
        >
          <Textarea name="notes" rows={5} />
        </Field>
      </div>
      {errorMessage ? (
        <div className="sm:col-span-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {errorMessage}
        </div>
      ) : null}
      <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-[var(--ds-space-3)] pt-[var(--ds-space-2)]">
        <p className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
          We typically respond within 24 hours.
        </p>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send enquiry"}
        </Button>
      </div>
    </form>
  );
}
