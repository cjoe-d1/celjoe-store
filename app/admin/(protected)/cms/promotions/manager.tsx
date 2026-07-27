"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Textarea, Button, Select, Checkbox } from "components/chds";
import {
  createPromotionAction,
  togglePromotionAction,
  deletePromotionAction,
} from "lib/actions/cms";
import type { PromotionRow } from "lib/supabase/admin/cms";

type Props = { initial: PromotionRow[] };

export function PromotionsManager({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const create = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createPromotionAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const toggle = (id: string, current: boolean) => {
    setError(null);
    startTransition(async () => {
      const r = await togglePromotionAction(id, !current);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this promotion?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deletePromotionAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[var(--ds-space-5)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}

      <form action={create} className="flex flex-col gap-[var(--ds-space-3)]">
        <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          New promotion
        </h3>
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Title">
            <TextInput name="title" required />
          </Field>
          <Field label="Code">
            <TextInput name="code" placeholder="SUMMER25" />
          </Field>
          <Field label="Discount type">
            <Select name="discount_type" defaultValue="percentage">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </Select>
          </Field>
          <Field label="Discount value">
            <TextInput name="discount_value" type="number" min="0" step="0.01" defaultValue="0" />
          </Field>
          <Field label="Starts at">
            <TextInput name="starts_at" type="datetime-local" />
          </Field>
          <Field label="Ends at">
            <TextInput name="ends_at" type="datetime-local" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea name="body" rows={2} />
        </Field>
        <Checkbox name="is_active" defaultChecked label="Active" />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create promotion"}
        </Button>
      </form>

      <div className="flex flex-col gap-[var(--ds-space-3)]">
        {initial.length === 0 ? (
          <p className="text-[var(--ds-color-muted)]">No promotions yet.</p>
        ) : (
          initial.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-[var(--ds-space-3)] rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]"
            >
              <div>
                <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                  {p.title}
                  {p.code ? ` · ${p.code}` : ""}
                </div>
                <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                  {p.discountType === "percentage" ? `${p.discountValue}%` : `₦${p.discountValue}`} off
                  {p.startsAt ? ` · from ${new Date(p.startsAt).toLocaleDateString()}` : ""}
                  {p.endsAt ? ` · until ${new Date(p.endsAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="flex gap-[var(--ds-space-2)]">
                <Button variant="outline" size="sm" onClick={() => toggle(p.id, p.isActive)} disabled={pending}>
                  {p.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(p.id)} disabled={pending}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
