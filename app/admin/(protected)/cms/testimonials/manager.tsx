"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  TextInput,
  Textarea,
  Button,
  Checkbox,
} from "components/chds";
import {
  createTestimonialAction,
  updateTestimonialAction,
  deleteTestimonialAction,
} from "lib/actions/cms";
import type { TestimonialRow } from "lib/supabase/admin/cms";

type Props = { initial: TestimonialRow[] };

export function TestimonialsManager({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createTestimonialAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await updateTestimonialAction(id, formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this testimonial?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteTestimonialAction(id);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-[var(--ds-space-6)]">
      {error ? (
        <div className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-danger)]/30 bg-[var(--ds-color-danger)]/10 p-[var(--ds-space-3)] text-[length:var(--ds-text-caption)] text-[var(--ds-color-fg)]">
          {error}
        </div>
      ) : null}

      <form action={handleCreate} className="flex flex-col gap-[var(--ds-space-3)]">
        <h3 className="text-[length:var(--ds-text-h4)] font-[var(--ds-font-weight-medium)] text-[var(--ds-color-fg)]">
          Add testimonial
        </h3>
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Author name">
            <TextInput name="author_name" required />
          </Field>
          <Field label="Author role / context">
            <TextInput name="author_role" placeholder="Guest, Lagos" />
          </Field>
          <Field label="Rating (1-5)">
            <TextInput name="rating" type="number" min="1" max="5" defaultValue="5" />
          </Field>
          <Field label="Image URL">
            <TextInput name="image_url" />
          </Field>
        </div>
        <Field label="Body">
          <Textarea name="body" required rows={3} />
        </Field>
        <Checkbox name="is_published" defaultChecked label="Published" />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Add testimonial"}
        </Button>
      </form>

      <div className="flex flex-col gap-[var(--ds-space-3)]">
        {initial.length === 0 ? (
          <p className="text-[var(--ds-color-muted)]">No testimonials yet.</p>
        ) : (
          initial.map((t) => (
            <div
              key={t.id}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]"
            >
              {editingId === t.id ? (
                <form
                  action={(fd) => handleUpdate(t.id, fd)}
                  className="flex flex-col gap-[var(--ds-space-3)]"
                >
                  <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
                    <Field label="Author name">
                      <TextInput name="author_name" defaultValue={t.authorName} />
                    </Field>
                    <Field label="Author role">
                      <TextInput name="author_role" defaultValue={t.authorRole ?? ""} />
                    </Field>
                    <Field label="Rating">
                      <TextInput name="rating" type="number" min="1" max="5" defaultValue={String(t.rating)} />
                    </Field>
                    <Field label="Image URL">
                      <TextInput name="image_url" defaultValue={t.imageUrl ?? ""} />
                    </Field>
                  </div>
                  <Field label="Body">
                    <Textarea name="body" defaultValue={t.body} rows={3} />
                  </Field>
                  <Checkbox name="is_published" defaultChecked={t.isPublished} label="Published" />
                  <div className="flex gap-[var(--ds-space-2)]">
                    <Button type="submit" variant="primary" disabled={pending}>
                      Save
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-[var(--ds-space-2)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                        {t.authorName}
                        {t.authorRole ? ` · ${t.authorRole}` : ""}
                      </div>
                      <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                        {t.rating}/5 · {t.isPublished ? "Published" : "Draft"}
                      </div>
                    </div>
                    <div className="flex gap-[var(--ds-space-2)]">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(t.id)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => handleDelete(t.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <p className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">{t.body}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
