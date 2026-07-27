import type { Metadata } from "next";

import { Button, Field, FormSection, TextInput } from "components/chds";
import { redirect } from "next/navigation";
import { AccountShell } from "../_shell";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
} from "lib/supabase/customer";
import { getCurrentCustomerSession } from "lib/auth/session";
import { auditFromCustomerSession, logAudit } from "lib/auth/audit";
import { getClientMetadata } from "lib/auth/session";

export const metadata: Metadata = {
  title: "Addresses",
  description: "Manage your delivery addresses.",
};

export const dynamic = "force-dynamic";

const createAddressAction = async (formData: FormData): Promise<void> => {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/addresses");
  }
  const label = String(formData.get("label") ?? "").trim() || null;
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postal_code") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;

  if (!line1 || !city || !state) {
    redirect("/account/addresses?error=" + encodeURIComponent("Street, city, and state are required."));
  }

  const result = await createCustomerAddress({
    label,
    line1,
    line2,
    city,
    state,
    postalCode,
    instructions,
  });
  if (!result.ok) {
    redirect("/account/addresses?error=" + encodeURIComponent(result.error));
  }

  const { ip, userAgent } = await getClientMetadata();
  await logAudit(
    auditFromCustomerSession(
      session,
      "customer_address.create",
      "customer_addresses",
      result.id,
      { label, city },
      ip,
      userAgent,
    ),
  );

  redirect("/account/addresses?saved=1");
};

const deleteAddressAction = async (formData: FormData): Promise<void> => {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/addresses");
  }
  const id = String(formData.get("address_id") ?? "");
  if (!id) redirect("/account/addresses?error=" + encodeURIComponent("Missing address id."));
  const result = await deleteCustomerAddress(id);
  if (!result.ok) {
    redirect("/account/addresses?error=" + encodeURIComponent(result.error));
  }

  const { ip, userAgent } = await getClientMetadata();
  await logAudit(
    auditFromCustomerSession(
      session,
      "customer_address.delete",
      "customer_addresses",
      id,
      null,
      ip,
      userAgent,
    ),
  );

  redirect("/account/addresses");
};

type SearchParams = Promise<{ error?: string; saved?: string }>;

export default async function AddressesPage(props: { searchParams: SearchParams }) {
  const sp = await props.searchParams;
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect("/account/login?next=/account/addresses");
  }
  const addresses = await listCustomerAddresses();

  return (
    <AccountShell
      current="/account/addresses"
      title="Addresses"
      description="Delivery addresses on file. Add one to speed up checkout."
    >
      {sp.saved === "1" ? (
        <div
          role="status"
          className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/40 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
        >
          Address saved.
        </div>
      ) : null}
      {sp.error ? (
        <div
          role="alert"
          className="mb-[var(--ds-space-4)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/40 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]"
        >
          {sp.error}
        </div>
      ) : null}

      {addresses.length > 0 ? (
        <ul className="flex flex-col gap-[var(--ds-space-3)]">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="rounded-[var(--ds-radius-lg)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-5)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-[var(--ds-space-3)]">
                <div>
                  <p className="font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
                    {a.label ?? "Address"}
                  </p>
                  <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}
                    {a.state ? `, ${a.state}` : ""}
                    {a.postalCode ? ` ${a.postalCode}` : ""}
                  </p>
                  {a.instructions ? (
                    <p className="mt-[var(--ds-space-1)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      {a.instructions}
                    </p>
                  ) : null}
                </div>
                <form action={deleteAddressAction}>
                  <input type="hidden" name="address_id" value={a.id} />
                  <Button type="submit" variant="ghost">
                    Remove
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[var(--ds-radius-xl)] border border-dashed border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]">
          <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
            No saved addresses
          </h3>
          <p className="mt-[var(--ds-space-2)] text-[length:var(--ds-text-body)] text-[var(--ds-color-muted)]">
            Add your first delivery address. You can save multiple and pick a default for checkout.
          </p>
        </div>
      )}

      <form
        className="mt-[var(--ds-space-6)] rounded-[var(--ds-radius-xl)] border border-[var(--ds-color-border)] bg-[var(--ds-color-surface)] p-[var(--ds-space-8)]"
        action={createAddressAction}
      >
        <FormSection
          title="Add an address"
          description="We only store what we need to deliver to you."
        >
          <Field label="Label">
            <TextInput
              id="label"
              name="label"
              placeholder="Home, Office, ..."
            />
          </Field>
          <div className="grid grid-cols-1 gap-[var(--ds-space-4)] sm:grid-cols-2">
            <Field label="Street">
              <TextInput id="line1" name="line1" required />
            </Field>
            <Field label="Apartment / Building">
              <TextInput id="line2" name="line2" />
            </Field>
            <Field label="City">
              <TextInput id="city" name="city" required />
            </Field>
            <Field label="State">
              <TextInput id="state" name="state" required />
            </Field>
            <Field label="Postal code">
              <TextInput id="postal_code" name="postal_code" />
            </Field>
          </div>
          <Field
            label="Delivery instructions"
            hint="Gate code, building, landmarks — anything that helps."
          >
            <TextInput id="instructions" name="instructions" />
          </Field>
        </FormSection>
        <div className="mt-[var(--ds-space-5)] flex justify-end">
          <Button type="submit">Save address</Button>
        </div>
      </form>
    </AccountShell>
  );
}
