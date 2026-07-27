"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, Button, Select, Textarea } from "components/chds";
import {
  receiveStockAction,
  adjustStockAction,
  recordWasteAction,
} from "lib/actions/inventory";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type Props = { ingredient: Ingredient };

export function InventoryActions({ ingredient }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<"receive" | "adjust" | "waste">("receive");

  const submit = (formData: FormData) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      let r;
      if (mode === "receive") {
        r = await receiveStockAction(
          ingredient.id,
          Number(formData.get("quantity")),
          Number(formData.get("unit_cost") ?? 0),
          (formData.get("supplier") as string) || null,
          String(formData.get("note") ?? ""),
        );
      } else if (mode === "adjust") {
        r = await adjustStockAction(
          ingredient.id,
          Number(formData.get("new_stock")),
          String(formData.get("note") ?? "Manual adjustment"),
        );
      } else {
        r = await recordWasteAction(
          ingredient.id,
          Number(formData.get("quantity")),
          String(formData.get("note") ?? "Waste"),
        );
      }
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setInfo("Saved.");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[var(--ds-space-3)]">
      <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
        <option value="receive">Receive stock</option>
        <option value="adjust">Adjust to value</option>
        <option value="waste">Record waste</option>
      </Select>
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-success)]/30 bg-[var(--ds-color-success)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {info}
        </div>
      ) : null}
      <form action={submit} className="flex flex-col gap-[var(--ds-space-3)]">
        {mode === "receive" ? (
          <>
            <Field label={`Quantity (${ingredient.unit})`}>
              <TextInput name="quantity" type="number" min="0" step="0.01" required />
            </Field>
            <Field label="Unit cost (₦)">
              <TextInput name="unit_cost" type="number" min="0" step="0.01" defaultValue="0" />
            </Field>
            <Field label="Supplier">
              <TextInput name="supplier" placeholder="Optional" />
            </Field>
            <Field label="Note">
              <Textarea name="note" rows={2} placeholder="Optional note" />
            </Field>
          </>
        ) : null}
        {mode === "adjust" ? (
          <>
            <Field label="New stock value">
              <TextInput name="new_stock" type="number" min="0" step="0.01" required defaultValue={ingredient.stock} />
            </Field>
            <Field label="Reason">
              <Textarea name="note" rows={2} required placeholder="Stock-take correction, count error, …" />
            </Field>
          </>
        ) : null}
        {mode === "waste" ? (
          <>
            <Field label={`Waste (${ingredient.unit})`}>
              <TextInput name="quantity" type="number" min="0" step="0.01" required />
            </Field>
            <Field label="Reason">
              <Textarea name="note" rows={2} required placeholder="Spoiled, dropped, expired" />
            </Field>
          </>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Submit"}
        </Button>
      </form>
    </div>
  );
}
