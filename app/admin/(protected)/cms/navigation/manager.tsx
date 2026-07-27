"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "components/chds";
import { saveNavigationAction } from "lib/actions/cms";

type Item = { label: string; href: string; position: number };

type Props = {
  location: "header" | "footer";
  initial: Item[];
};

export function NavigationManager({ location, initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, key: keyof Item, value: string) => {
    setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  };
  const add = () => setItems((arr) => [...arr, { label: "", href: "", position: arr.length }]);
  const remove = (i: number) => setItems((arr) => arr.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    setItems((arr) => {
      const next = [...arr];
      const target = i + dir;
      if (target < 0 || target >= next.length) return arr;
      const a = next[i];
      const b = next[target];
      if (!a || !b) return arr;
      next[i] = b;
      next[target] = a;
      return next.map((it, idx) => ({ ...it, position: idx }));
    });
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveNavigationAction(location, items);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[var(--ds-space-3)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-2)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}
      {items.length === 0 ? (
        <p className="text-[var(--ds-color-muted)]">No items yet. Add one below.</p>
      ) : (
        items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-end gap-[var(--ds-space-2)]">
            <TextInput
              value={it.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label"
            />
            <TextInput
              value={it.href}
              onChange={(e) => update(i, "href", e.target.value)}
              placeholder="/path"
            />
            <Button variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
              ↑
            </Button>
            <Button variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
              ↓
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(i)}>
              Remove
            </Button>
          </div>
        ))
      )}
      <div className="flex gap-[var(--ds-space-2)]">
        <Button variant="outline" onClick={add}>
          Add item
        </Button>
        <Button variant="primary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save navigation"}
        </Button>
      </div>
    </div>
  );
}
