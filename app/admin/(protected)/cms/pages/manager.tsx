"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, TextInput, Textarea, Button, Checkbox } from "components/chds";
import {
  createCmsPageAction,
  updateCmsPageAction,
  deleteCmsPageAction,
} from "lib/actions/cms";
import type { CmsPageRow } from "lib/supabase/admin/cms";

type Props = { initial: CmsPageRow[] };

export function PagesManager({ initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const create = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await createCmsPageAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    });
  };

  const update = (id: string, formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const r = await updateCmsPageAction(id, formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Delete this page?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteCmsPageAction(id);
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
          New page
        </h3>
        <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
          <Field label="Title">
            <TextInput name="title" required />
          </Field>
          <Field label="Slug">
            <TextInput name="slug" required placeholder="about-us" />
          </Field>
          <Field label="SEO title">
            <TextInput name="seo_title" />
          </Field>
          <Field label="SEO description">
            <TextInput name="seo_description" />
          </Field>
        </div>
        <Field label="Body" >
          <Textarea name="body" required rows={6} />
        </Field>
        <Checkbox name="is_published" defaultChecked label="Published" />
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create page"}
        </Button>
      </form>

      <div className="flex flex-col gap-[var(--ds-space-3)]">
        {initial.length === 0 ? (
          <p className="text-[var(--ds-color-muted)]">No pages yet.</p>
        ) : (
          initial.map((p) => (
            <div
              key={p.id}
              className="rounded-[var(--ds-radius-md)] border border-[var(--ds-color-border)] p-[var(--ds-space-4)]"
            >
              {editingId === p.id ? (
                <form action={(fd) => update(p.id, fd)} className="flex flex-col gap-[var(--ds-space-3)]">
                  <div className="grid grid-cols-1 gap-[var(--ds-space-3)] md:grid-cols-2">
                    <Field label="Title">
                      <TextInput name="title" defaultValue={p.title} required />
                    </Field>
                    <Field label="Slug (read-only)">
                      <TextInput name="slug" defaultValue={p.slug} disabled />
                    </Field>
                    <Field label="SEO title">
                      <TextInput name="seo_title" defaultValue={p.seoTitle ?? ""} />
                    </Field>
                    <Field label="SEO description">
                      <TextInput name="seo_description" defaultValue={p.seoDescription ?? ""} />
                    </Field>
                  </div>
                  <Field label="Body">
                    <Textarea name="body" defaultValue={p.body} rows={6} />
                  </Field>
                  <Checkbox name="is_published" defaultChecked={p.isPublished} label="Published" />
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
                <div className="flex items-start justify-between gap-[var(--ds-space-3)]">
                  <div>
                    <div className="text-[length:var(--ds-text-body)] text-[var(--ds-color-fg)]">
                      {p.title}
                    </div>
                    <div className="text-[length:var(--ds-text-caption)] text-[var(--ds-color-muted)]">
                      /{p.slug} · {p.isPublished ? "Published" : "Draft"}
                    </div>
                  </div>
                  <div className="flex gap-[var(--ds-space-2)]">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/page/${p.slug}`} target="_blank">
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(p.id)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)} disabled={pending}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
